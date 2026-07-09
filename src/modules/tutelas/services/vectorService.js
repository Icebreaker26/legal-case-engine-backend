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

export const buscarContextoLegal = async (vectorTutelaLocal, textoOriginal = '', limit = 5, categoria = null) => {
  if (!vectorTutelaLocal || !Array.isArray(vectorTutelaLocal) || vectorTutelaLocal.length === 0) {
    throw new Error('Vector inválido o vacío');
  }

  const texto = textoOriginal || '';

  try {
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

  } catch (error) {
    console.error('Error buscando en pgvector local:', error);
    throw new Error('Fallo al buscar casos previos localmente');
  }
};
