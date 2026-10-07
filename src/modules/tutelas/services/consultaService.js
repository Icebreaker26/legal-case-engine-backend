import { generarEmbeddingLocal } from './aiService.js';
import { buscarContextoLegal } from './vectorService.js';
import pool from '../../../db/database.js';
import logger from '../../../utils/logger.js';

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
 */
export const registrarImpresiones = async ({ usuario_uuid = null, tutela_id = null, categoria_contexto = null, resultados = [] }) => {
  if (!resultados.length) return;

  try {
    const columnas = ['usuario_uuid', 'tutela_id', 'documento_id', 'categoria_contexto', 'posicion_mostrada', 'posicion_contrafactual', 'score_base'];
    const values = [];
    const filas = resultados.map((r, i) => {
      const posicion = i + 1;
      const contrafactual = r.posicion_contrafactual ?? posicion;
      values.push(usuario_uuid, tutela_id, r.documento_id, categoria_contexto, posicion, contrafactual, r.score_semantico ?? r.score ?? null);
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
