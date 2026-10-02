import pool from '../../../db/database.js';

/**
 * Busca los documentos más similares a la tutela.
 *
 * Estrategia de dos fases:
 *   1. CTE "scored": calcula score para cada chunk y marca con ROW_NUMBER el
 *      chunk de mayor ts_rank dentro de cada documento (el más relevante por texto).
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

  return `
    WITH scored AS (
      SELECT
        categoria, titulo_referencia, contenido_legal, documento_id,
        relevancia_score, comprension_doc,
        (comprension_doc IS NOT NULL) AS tiene_comprension,
        ROUND(CAST(
          (1 - (COALESCE(embedding_comprension, embedding_local) <=> $1::vector)) * 0.55 +
          LEAST(ts_rank(contenido_tsv, plainto_tsquery('spanish', $2)), 1.0) * 0.35 +
          LEAST(GREATEST(relevancia_score, 0), 10) / 10.0 * 0.10
        AS NUMERIC), 4) AS score,
        ROW_NUMBER() OVER (
          PARTITION BY documento_id
          ORDER BY ts_rank(contenido_tsv, plainto_tsquery('spanish', $2)) DESC
        ) AS rn
      FROM base_conocimiento_enel
      WHERE embedding_local IS NOT NULL
        AND es_exitosa = TRUE
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

    // Complementa con búsqueda global excluyendo los ya encontrados
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
    WHERE embedding_local IS NOT NULL AND es_exitosa = TRUE ${CATEGORIA_FILTER}
    ORDER BY embedding_local <=> $1::vector
    LIMIT $5
  ),
  txt AS (
    SELECT b.id, ROW_NUMBER() OVER (ORDER BY ts_rank(b.contenido_tsv, q.tsq) DESC) AS rank
    FROM base_conocimiento_enel b, q
    WHERE b.embedding_local IS NOT NULL AND b.es_exitosa = TRUE ${CATEGORIA_FILTER}
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
    WHERE embedding_local IS NOT NULL AND es_exitosa = TRUE
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

export const buscarContextoLegal = async (vectorTutelaLocal, textoOriginal = '', limit = 5, categoria = null, { fusion = 'ponderado' } = {}) => {
  if (!vectorTutelaLocal || !Array.isArray(vectorTutelaLocal) || vectorTutelaLocal.length === 0) {
    throw new Error('Vector inválido o vacío');
  }

  const texto = textoOriginal || '';

  try {
    if (fusion === 'rrf') {
      return await buscarRRF(vectorTutelaLocal, texto, limit, categoria);
    }
    return await buscarPonderado(vectorTutelaLocal, texto, limit, categoria);
  } catch (error) {
    console.error('Error buscando en pgvector local:', error);
    throw new Error('Fallo al buscar casos previos localmente');
  }
};
