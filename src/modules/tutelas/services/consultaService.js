import { generarEmbeddingLocal } from './aiService.js';
import { buscarContextoLegal, baseIndexadaConModelo, MODELO_ALPHA_FB, GAMMA_ECCP, ECCP_CONFIG_VERSION } from './vectorService.js';
import { estaAlphaFbActivoParaEndpoint } from './featureFlagService.js';
import pool from '../../../db/database.js';
import logger from '../../../utils/logger.js';
import { env } from '../../../config/env.js';

/**
 * Construye el texto de consulta (vectorial y léxico) usado para buscar
 * precedentes en base_conocimiento_enel. Punto único — antes esta lógica
 * estaba repetida (e inconsistente) en 4 endpoints de tutelaController.js.
 *
 * `tutela` es un objeto plano con, al menos, `contenido_original` y
 * opcionalmente `analisis_comprension` — no necesita ser una fila real de
 * la tabla `tutelas` (p.ej. procesarTutela lo llama antes de insertar).
 */
export const construirConsulta = (tutela, { estrategia = 'actual' } = {}) => {
  const textoCompleto = tutela.contenido_original || '';
  const comprension = tutela.analisis_comprension || null;

  if (estrategia === 'completo') {
    return { textoVector: textoCompleto, textoLexico: textoCompleto };
  }

  if (estrategia === 'actual' || estrategia === 'comprension') {
    const textoVector = comprension?.tema_central
      ? `${comprension.tema_central}. ${(comprension.peticiones || []).join('. ')}`
      : textoCompleto.substring(0, 1500);
    return { textoVector, textoLexico: textoCompleto };
  }

  throw new Error(`Estrategia de consulta no soportada: "${estrategia}"`);
};

/**
 * Punto único de entrada para recuperar precedentes — construye la consulta,
 * genera su embedding y busca en base_conocimiento_enel. Antes esta
 * orquestación de 3 pasos estaba repetida en los 4 mismos endpoints que
 * construirConsulta(); centralizarla evita que el arnés de evaluación tenga
 * que reimplementarla (y así medir algo distinto de lo que corre en producción).
 */
export const recuperarPrecedentes = async ({
  tutela,
  categoria = null,
  limit = 5,
  estrategia = 'actual',
  fusion = 'ponderado',
  alpha = 0.9,
  // ECCP (#161 fase e): categoría jurídica que condiciona la lectura de la
  // feromona en fusion:'alpha_fb' -- nunca filtra la recuperación (#106),
  // a diferencia de `categoria`. Independiente de `categoria` a propósito.
  contexto = null,
}) => {
  const { textoVector, textoLexico } = construirConsulta(tutela, { estrategia });
  const vector = await generarEmbeddingLocal(textoVector, { tipo: 'query' });
  return buscarContextoLegal(vector, textoLexico, limit, categoria, { fusion, alpha, contexto });
};

/**
 * Decide la fusión de un endpoint de recuperación (#193, épica #199).
 *
 * La configuración validada en el trabajo de grado (#121/#127) es 'alpha'
 * (2 términos, e5-small, α=0.9). Es la fusión por defecto, protegida por una
 * guarda dura de modelo y datos:
 *
 *   1. EMBEDDING_MODEL debe ser el modelo validado (MODELO_ALPHA_FB, e5-small).
 *   2. base_conocimiento_enel debe estar 100% reindexada a ese modelo.
 *
 * Si alguna falla — o la propia consulta de la guarda falla — se cae a
 * 'ponderado' con `logger.warn`/`error`: comparar vectores de espacios
 * distintos no da error, solo resultados sin sentido, así que nunca se usa α
 * sobre el modelo o los datos equivocados.
 *
 * Con la guarda en regla, la estigmergia (ECCP, 'alpha_fb' = 'alpha' + re-ranking
 * acotado, experimental) se suma solo si el flag del endpoint en system_config
 * está activo y RAG_ALPHA_FB_KILL no lo apaga; si no, el endpoint corre 'alpha'.
 * El kill switch apaga solo ECCP: ya no devuelve el endpoint a 'ponderado'.
 *
 * La fusión usada queda registrada por impresión en `fusion_modo`
 * (registrarImpresiones), así que una caída a 'ponderado' es visible.
 */
// `db` es inyectable (default: el pool compartido) solo para los tests de
// integración -- ver la nota en baseIndexadaConModelo (vectorService.js).
export const resolverFusion = async (endpoint, db = pool) => {
  try {
    if (env.EMBEDDING_MODEL !== MODELO_ALPHA_FB) {
      logger.warn(`fusion: EMBEDDING_MODEL="${env.EMBEDDING_MODEL}" distinto de "${MODELO_ALPHA_FB}" -- cae a 'ponderado' (endpoint: ${endpoint})`);
      return 'ponderado';
    }

    const sincronizado = await baseIndexadaConModelo(MODELO_ALPHA_FB, db);
    if (!sincronizado) {
      logger.warn(`fusion: base_conocimiento_enel aún tiene filas activas sin reindexar a "${MODELO_ALPHA_FB}" -- cae a 'ponderado' (endpoint: ${endpoint})`);
      return 'ponderado';
    }

    if (env.RAG_ALPHA_FB_KILL) {
      logger.warn(`alpha_fb: RAG_ALPHA_FB_KILL activo -- ECCP apagado, corre 'alpha' (endpoint: ${endpoint})`);
      return 'alpha';
    }

    // El flag solo decide la capa experimental: si su lectura falla, el
    // endpoint se queda en la configuración validada, no cae a 'ponderado'.
    try {
      return (await estaAlphaFbActivoParaEndpoint(endpoint)) ? 'alpha_fb' : 'alpha';
    } catch (error) {
      logger.error(`alpha_fb: error leyendo el flag de ECCP, corre 'alpha' (endpoint: ${endpoint})`, { error: error.message });
      return 'alpha';
    }
  } catch (error) {
    logger.error(`fusion: error resolviendo la guarda dura, cae a 'ponderado' (endpoint: ${endpoint})`, { error: error.message });
    return 'ponderado';
  }
};

/**
 * Instrumentación ECCP (#165 fase b): registra qué precedentes se mostraron,
 * en qué posición y con qué score, para poder medir más adelante si la
 * feromona cambia algo. `posicion_contrafactual` es la posición que el
 * documento tendría con S_base puro, sin feromona -- en los modos de fusión
 * sin feromona (todos salvo `alpha_fb`, #161 fase e) coincide siempre con
 * `posicion_mostrada`; `buscarAlphaFb` (vectorService.js) adjunta su propio
 * `posicion_contrafactual` a cada resultado cuando reordena, y aquí se
 * respeta si viene presente.
 *
 * Nunca lanza: es telemetría del camino de lectura, un fallo aquí no debe
 * romper la búsqueda de precedentes que ya se le devolvió al abogado.
 *
 * `fusion` (#174): modo de fusión realmente usado para estos resultados --
 * determina `gamma`/`config_version` (solo tienen sentido para 'alpha_fb';
 * NULL en cualquier otro modo) y queda registrado en `fusion_modo` /
 * `embedding_model` para poder segmentar el monitoreo del piloto de #173 por
 * configuración activa en el momento de la búsqueda.
 *
 * Limitación conocida (#174): esto registra el modo que SE USÓ, no un
 * contrafactual de lo que el otro modo habría dado cuando `alpha_fb` está
 * apagado -- comparar 'ponderado' (3 términos con relevancia_score) contra
 * 'alpha_fb' (2 términos) en modo sombra requeriría correr ambas fórmulas
 * sobre formulaciones de candidatos distintas, que queda fuera de alcance de
 * este lote (ver discusión en el PR). `posicion_contrafactual` ya cubre el
 * sentido inverso: con `alpha_fb` encendido, siempre registra qué posición
 * habría tenido el documento con S_base puro, sin feromona.
 */
export const registrarImpresiones = async ({ usuario_uuid = null, tutela_id = null, categoria_contexto = null, resultados = [], fusion = 'ponderado' }) => {
  if (!resultados.length) return;

  try {
    const gamma = fusion === 'alpha_fb' ? GAMMA_ECCP : null;
    const configVersion = fusion === 'alpha_fb' ? ECCP_CONFIG_VERSION : null;
    const embeddingModel = env.EMBEDDING_MODEL;

    const columnas = ['usuario_uuid', 'tutela_id', 'documento_id', 'categoria_contexto', 'posicion_mostrada', 'posicion_contrafactual', 'score_base', 'fusion_modo', 'embedding_model', 'gamma', 'config_version', 'delta_feromona', 'es_exploracion'];
    const values = [];
    const filas = resultados.map((r, i) => {
      const posicion = i + 1;
      const contrafactual = r.posicion_contrafactual ?? posicion;
      values.push(
        usuario_uuid, tutela_id, r.documento_id, categoria_contexto, posicion, contrafactual, r.score_semantico ?? r.score ?? null,
        fusion, embeddingModel, gamma, configVersion, r.delta_feromona ?? null, r.es_exploracion ?? false
      );
      const offset = i * columnas.length;
      return `(${columnas.map((_, j) => `$${offset + j + 1}`).join(', ')})`;
    });

    await pool.query(
      `INSERT INTO impresiones_precedentes (${columnas.join(', ')}) VALUES ${filas.join(', ')}`,
      values
    );
  } catch (error) {
    logger.error('Error registrando impresiones de precedentes (ECCP)', { error: error.message });
  }
};
