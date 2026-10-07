import pool from '../../../db/database.js';
import { obtenerSenalesFeromona } from './pheromoneService.js';

/**
 * Busca los documentos más similares a la tutela.
 *
 * Estrategia de dos fases:
 *   1. CTE "scored": calcula score para cada chunk y marca con ROW_NUMBER el
 *      chunk de mayor score híbrido dentro de cada documento (el más relevante).
 *   2. Filtra rn = 1  → un representante por documento → ORDER BY score global.
 *
 * COALESCE(embedding_comprension, embedding_local):
 *   - Docs con comprensión semántica: matching semántico↔semántico
 *   - Docs sin comprensión:           matching texto↔texto (fallback sin cambios)
 */
const buildScoringCTE = ({ filtrarCategoria, excluirIds = [] }) => {
  const exclusion = excluirIds.length
    ? `AND documento_id <> ALL(ARRAY[${excluirIds.map((_, i) => `$${i + 4}`).join(',')}]::uuid[])`
    : '';

  const categoriaFilter = filtrarCategoria ? 'AND categoria ILIKE $4' : '';
  // Si hay exclusión, el filtro de categoría ya ocupó $4, así que los IDs empiezan en $5.
  // Sin categoría, los IDs empiezan en $4.
  // Nota: categoría y exclusión son mutuamente excluyentes en el uso actual.

  // La expresión se repite (no se puede referenciar el alias "score" del SELECT
  // list dentro del propio SELECT): ROW_NUMBER() debe partir el documento por el
  // mismo score híbrido, no solo por ts_rank, o descarta el mejor chunk semántico.
  const scoreExpr = `
          (1 - (COALESCE(embedding_comprension, embedding_local) <=> $1::vector)) * 0.55 +
          LEAST(ts_rank(contenido_tsv, plainto_tsquery('spanish', $2)), 1.0) * 0.35 +
          LEAST(GREATEST(relevancia_score, 0), 10) / 10.0 * 0.10
  `;

  return `
    WITH scored AS (
      SELECT
        categoria, titulo_referencia, contenido_legal, documento_id,
        relevancia_score, comprension_doc,
        (comprension_doc IS NOT NULL) AS tiene_comprension,
        ROUND(CAST(${scoreExpr} AS NUMERIC), 4) AS score,
        ROW_NUMBER() OVER (
          PARTITION BY documento_id
          ORDER BY ${scoreExpr} DESC
        ) AS rn
      FROM base_conocimiento_enel
      WHERE embedding_local IS NOT NULL
        AND es_exitosa = TRUE
        AND is_active = TRUE
        AND documento_id IS NOT NULL
        ${categoriaFilter}
        ${exclusion}
    )
    SELECT categoria, titulo_referencia, contenido_legal, documento_id,
           relevancia_score, score, tiene_comprension, comprension_doc
    FROM scored
    WHERE rn = 1
    ORDER BY score DESC
    LIMIT $3;
  `;
};

const buscarPonderado = async (vectorTutelaLocal, texto, limit, categoria) => {
  if (categoria?.trim()) {
    const params = [JSON.stringify(vectorTutelaLocal), texto, limit, `%${categoria}%`];
    const { rows } = await pool.query(buildScoringCTE({ filtrarCategoria: true }), params);

    if (rows.length >= 3) return rows;

    // Complementa con búsqueda global excluyendo los ya encontrados.
    // idsEncontrados nunca puede traer un NULL (buildScoringCTE ya filtra
    // documento_id IS NOT NULL) — si lo trajera, "<> ALL(ARRAY[NULL,...])"
    // evalúa a NULL por fila (semántica SQL de NULL) y el WHERE completo
    // descarta todas las filas en silencio (#67).
    const idsEncontrados = rows.map(r => r.documento_id);
    const faltantes = limit - rows.length;
    const complementoParams = [JSON.stringify(vectorTutelaLocal), texto, faltantes, ...idsEncontrados];
    const { rows: complemento } = await pool.query(
      buildScoringCTE({ filtrarCategoria: false, excluirIds: idsEncontrados }),
      complementoParams
    );

    return [...rows, ...complemento];
  }

  const { rows } = await pool.query(
    buildScoringCTE({ filtrarCategoria: false }),
    [JSON.stringify(vectorTutelaLocal), texto, limit]
  );
  return rows;
};

// ── Fusión RRF (Reciprocal Rank Fusion) ──────────────────────────────────────
//
// Alternativa a buildScoringCTE: en vez de mezclar escalas crudas (coseno,
// ts_rank, relevancia_score) en una fórmula ponderada sin justificación
// empírica, cada señal se rankea por separado (top CANDIDATOS) y se fusiona
// por posición de rango — el estándar de facto en búsqueda híbrida.
//
// Las ramas vectorial y léxica usan ORDER BY + LIMIT directo sobre la
// columna indexada, así que SÍ pueden usar los índices HNSW y GIN existentes
// (verificado con EXPLAIN forzando enable_seqscan=off — con el volumen de
// datos actual, de cientos de filas, el planner prefiere un seq scan porque
// es más barato, no porque el índice no aplique).
//
// La rama léxica construye un OR de lexemas (to_tsquery('simple', ...)) en
// vez de plainto_tsquery (que arma un AND de todas las palabras de la
// consulta y casi nunca matchea con textos largos) — corrige el mismo
// problema que tiene ambientalEmbeddingService.js.
const RRF_K = 60;
// hnsw.ef_search (pgvector) tiene default 40 — con CANDIDATOS > ef_search,
// la rama vectorial devolvería menos de CANDIDATOS filas en producción (a
// escala, cuando el planner use el índice) aunque en pruebas con pocas filas
// no se note porque el planner usa seq scan. Se iguala a 40 por consistencia.
const CANDIDATOS = 40;

// $4 (categoría) puede ser NULL — "AND ($4::text IS NULL OR categoria ILIKE $4)"
// es un no-op cuando no se filtra, y evita tener dos variantes de la query
// con distinta numeración de parámetros.
const CATEGORIA_FILTER = "AND ($4::text IS NULL OR categoria ILIKE $4)";

const RRF_QUERY = `
  WITH q AS (
    SELECT to_tsquery('simple', string_agg(lexeme, ' | ')) AS tsq
    FROM unnest(to_tsvector('spanish', $2)) AS lexeme
  ),
  vec AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY embedding_local <=> $1::vector) AS rank
    FROM base_conocimiento_enel
    WHERE embedding_local IS NOT NULL AND es_exitosa = TRUE AND is_active = TRUE
      AND documento_id IS NOT NULL ${CATEGORIA_FILTER}
    ORDER BY embedding_local <=> $1::vector
    LIMIT $5
  ),
  txt AS (
    SELECT b.id, ROW_NUMBER() OVER (ORDER BY ts_rank(b.contenido_tsv, q.tsq) DESC) AS rank
    FROM base_conocimiento_enel b, q
    WHERE b.embedding_local IS NOT NULL AND b.es_exitosa = TRUE AND b.is_active = TRUE
      AND b.documento_id IS NOT NULL ${CATEGORIA_FILTER}
      AND q.tsq IS NOT NULL AND b.contenido_tsv @@ q.tsq
    ORDER BY ts_rank(b.contenido_tsv, q.tsq) DESC
    LIMIT $5
  ),
  rel AS (
    -- relevancia_score default es 0 (NOT NULL) para todo documento sin
    -- feedback del abogado. Sin el filtro > 0, todos los docs con 0 empatan
    -- y Postgres los devuelve en un orden arbitrario (en la práctica, el de
    -- inserción) — un documento sin ningún feedback podría terminar en el
    -- puesto 1 de esta lista y recibir el mismo impulso RRF que el mejor
    -- resultado semántico real. Solo los documentos con feedback positivo
    -- entran a esta señal.
    SELECT id, ROW_NUMBER() OVER (ORDER BY relevancia_score DESC) AS rank
    FROM base_conocimiento_enel
    WHERE embedding_local IS NOT NULL AND es_exitosa = TRUE AND is_active = TRUE
      AND documento_id IS NOT NULL
      AND relevancia_score > 0 ${CATEGORIA_FILTER}
    ORDER BY relevancia_score DESC
    LIMIT $5
  ),
  fused AS (
    SELECT id, SUM(1.0 / ($6 + rank)) AS rrf_score
    FROM (SELECT * FROM vec UNION ALL SELECT * FROM txt UNION ALL SELECT * FROM rel) u
    GROUP BY id
  ),
  mejor_chunk AS (
    SELECT DISTINCT ON (b.documento_id)
      b.categoria, b.titulo_referencia, b.contenido_legal, b.documento_id,
      b.relevancia_score, b.comprension_doc,
      (b.comprension_doc IS NOT NULL) AS tiene_comprension,
      f.rrf_score
    FROM fused f
    JOIN base_conocimiento_enel b ON b.id = f.id
    ORDER BY b.documento_id, f.rrf_score DESC
  )
  SELECT categoria, titulo_referencia, contenido_legal, documento_id,
         relevancia_score, ROUND(CAST(rrf_score AS NUMERIC), 6) AS score,
         tiene_comprension, comprension_doc
  FROM mejor_chunk
  ORDER BY score DESC
  LIMIT $3;
`;

const buscarRRF = async (vectorTutelaLocal, texto, limit, categoria) => {
  const categoriaParam = categoria?.trim() ? `%${categoria}%` : null;
  const params = [JSON.stringify(vectorTutelaLocal), texto, limit, categoriaParam, CANDIDATOS, RRF_K];
  const { rows } = await pool.query(RRF_QUERY, params);
  return rows;
};

// ── Fusión ponderada por α (#127) ────────────────────────────────────────────
//
// `buscarPonderado` (arriba) NO es la configuración que #121 confirmó con
// significancia estadística — ese resultado (e5-small, α=0.9) se produjo con
// una fórmula de 2 términos (coseno*α + ts_rank*(1-α), sin relevancia_score),
// definida solo en eval/scripts/v2_barrido_pesos.js y corrida con SQL directo
// contra la base de evaluación, nunca contra este archivo (ver #123/#127).
// Este modo replica esa fórmula exacta, parametrizada por alpha, para poder
// reproducirla a través del pipeline real (recuperarPrecedentes) y confirmar
// que el código de producción, tal cual, da el mismo nDCG@10 reportado.
//
// Deliberadamente NO reemplaza 'ponderado' como default — fusion:'alpha' solo
// se usa si el caller lo pide explícitamente.
//
// Orden por score crudo (no ROUND) con desempate por documento_id ASC: el
// barrido de #115/#121 ordena así (ver v2_barrido_pesos.js) — redondear antes
// de ordenar, como hace buildScoringCTE, puede cambiar el ranking cuando los
// scores quedan muy juntos (típico con α alto). El ROUND solo se aplica a la
// columna que se expone, nunca al ORDER BY.
const buildAlphaScoringCTE = () => {
  const scoreExpr = `
          (1 - (COALESCE(embedding_comprension, embedding_local) <=> $1::vector)) * $5::float8 +
          LEAST(ts_rank(contenido_tsv, plainto_tsquery('spanish', $2)), 1.0) * (1 - $5::float8)
  `;

  return `
    WITH scored AS (
      SELECT
        categoria, titulo_referencia, contenido_legal, documento_id,
        relevancia_score, comprension_doc, vigencia_factor,
        (comprension_doc IS NOT NULL) AS tiene_comprension,
        ${scoreExpr} AS score_crudo,
        ROW_NUMBER() OVER (
          PARTITION BY documento_id
          ORDER BY ${scoreExpr} DESC, documento_id ASC
        ) AS rn
      FROM base_conocimiento_enel
      WHERE embedding_local IS NOT NULL
        AND es_exitosa = TRUE
        AND is_active = TRUE
        AND documento_id IS NOT NULL
        AND ($4::text IS NULL OR categoria ILIKE $4)
    )
    SELECT categoria, titulo_referencia, contenido_legal, documento_id,
           relevancia_score, ROUND(CAST(score_crudo AS NUMERIC), 6) AS score,
           score_crudo, tiene_comprension, comprension_doc, vigencia_factor
    FROM scored
    WHERE rn = 1
    ORDER BY score_crudo DESC, documento_id ASC
    LIMIT $3;
  `;
};

// alpha ya se valida en buscarContextoLegal antes de llegar aquí.
const buscarAlpha = async (vectorTutelaLocal, texto, limit, categoria, alpha) => {
  const categoriaParam = categoria?.trim() ? `%${categoria}%` : null;
  const params = [JSON.stringify(vectorTutelaLocal), texto, limit, categoriaParam, alpha];
  const { rows } = await pool.query(buildAlphaScoringCTE(), params);
  return rows;
};

// ── Re-ranking acotado con feromona (#161 fase e, ECCP) ──────────────────────
//
// Score_final(i) = vigencia_factor(i) · [S_base(i) + γ·señal_feromona(c,i)]
// (diseño §3.3), aplicado solo dentro del top-K de S_base -- la feromona
// reordena entre precedentes ya semánticamente comparables, nunca sube algo
// lejano. Con γ=0 o sin rastros (señal=0 siempre), el orden resultante es
// idéntico al de 'alpha' puro -- degeneración segura (§3.3, §3.6 punto 4).
//
// Modo opcional (fusion:'alpha_fb'), nunca el default de producción.
const K_RERANK = 20;

// Calibrado offline (#161 fase e) sobre el run confirmatorio real de #121
// (e5-small, α=0.9, corpus v1, 120 consultas de dev+test combinadas):
// eval/data/runs/v1-confirmatorio-e5-a0.9.trec -- mitad de la diferencia
// típica de S_base entre el puesto 1 y el puesto 5 (mediana sobre las 120
// consultas = 0.04147, media = 0.04588). Se usa la mediana (más robusta a
// colas) redondeada: γ = 0.0415 / 2 ≈ 0.02.
export const GAMMA_ECCP = 0.02;

const buscarAlphaFb = async (vectorTutelaLocal, texto, limit, alpha, contexto, gamma = GAMMA_ECCP) => {
  // Sin filtro de categoría en la recuperación (#106) -- `contexto` solo
  // condiciona la lectura de la feromona, nunca qué candidatos entran al CTE.
  const params = [JSON.stringify(vectorTutelaLocal), texto, K_RERANK, null, alpha];
  const { rows: candidatos } = await pool.query(buildAlphaScoringCTE(), params);

  if (!candidatos.length) return [];

  const senales = await obtenerSenalesFeromona(candidatos.map(c => c.documento_id), contexto);

  return candidatos
    // `candidatos` ya viene ordenado por score_crudo DESC (ORDER BY del CTE)
    // -- el índice es su posición contrafactual, la que tendría con S_base
    // puro, sin feromona (#165 fase b, instrumentación de impresiones).
    .map((c, idx) => {
      // Precisión completa, no el `score` ya redondeado a 6 decimales --
      // con γ=0 (degeneración segura) el ORDER BY debe coincidir exactamente
      // con el de 'alpha' puro (que ordena por score_crudo, no por score),
      // o dos candidatos que solo difieren después del redondeo pueden
      // desempatarse distinto por documento_id (auditoría de Opus, PR #172).
      const scoreSemantico = Number(c.score_crudo);
      const vigencia = c.vigencia_factor != null ? Number(c.vigencia_factor) : 1;
      const senal = senales[c.documento_id] ?? 0;
      const scoreFinal = vigencia * (scoreSemantico + gamma * senal);
      // ECCP (#142, #167): `score` y `score_semantico` son siempre S_base
      // puro -- `buildFichaPrecedente` nunca debe poder leer el componente
      // de feromona. `score_final` solo ordena, no se expone como "score".
      return { ...c, vigencia, score_semantico: scoreSemantico, score_final: scoreFinal, posicion_contrafactual: idx + 1 };
    })
    // Diseño §3.3 "por evento normativo": vigencia_factor=0 (precedente
    // jurídicamente superado) desaparece de inmediato -- no solo baja su
    // score a 0, se excluye del resultado aunque quepa en `limit`.
    .filter((c) => c.vigencia !== 0)
    .sort((a, b) => b.score_final - a.score_final || a.documento_id.localeCompare(b.documento_id))
    .slice(0, limit);
};

export const buscarContextoLegal = async (vectorTutelaLocal, textoOriginal = '', limit = 5, categoria = null, { fusion = 'ponderado', alpha = 0.9, contexto = null, gamma = GAMMA_ECCP } = {}) => {
  if (!vectorTutelaLocal || !Array.isArray(vectorTutelaLocal) || vectorTutelaLocal.length === 0) {
    throw new Error('Vector inválido o vacío');
  }
  // Validado antes del try (como el vector arriba): es un error de uso de la
  // API, no una falla de la base de datos — no debe quedar enmascarado por
  // el catch genérico de más abajo.
  if ((fusion === 'alpha' || fusion === 'alpha_fb') && (typeof alpha !== 'number' || Number.isNaN(alpha) || alpha < 0 || alpha > 1)) {
    throw new Error(`alpha inválido para fusion '${fusion}': ${alpha} (debe ser un número entre 0 y 1)`);
  }

  const texto = textoOriginal || '';

  try {
    if (fusion === 'rrf') {
      return await buscarRRF(vectorTutelaLocal, texto, limit, categoria);
    }
    if (fusion === 'alpha_fb') {
      return await buscarAlphaFb(vectorTutelaLocal, texto, limit, alpha, contexto, gamma);
    }
    if (fusion === 'alpha') {
      return await buscarAlpha(vectorTutelaLocal, texto, limit, categoria, alpha);
    }
    return await buscarPonderado(vectorTutelaLocal, texto, limit, categoria);
  } catch (error) {
    console.error('Error buscando en pgvector local:', error);
    throw new Error('Fallo al buscar casos previos localmente');
  }
};
