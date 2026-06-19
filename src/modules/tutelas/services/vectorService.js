import pool from '../../../db/database.js';

/**
 * Busca fragmentos legales similares usando el motor local (384 dimensiones).
 * Solo devuelve casos marcados como exitosos para garantizar calidad.
 */
const SCORING_QUERY = (filtrarCategoria) => `
  SELECT categoria, titulo_referencia, contenido_legal, documento_id, relevancia_score,
         ROUND(CAST(
           (1 - (embedding_local <=> $1)) * 0.55 +
           LEAST(ts_rank(contenido_tsv, plainto_tsquery('spanish', $2)), 1.0) * 0.35 +
           LEAST(GREATEST(relevancia_score, 0), 10) / 10.0 * 0.10
         AS NUMERIC), 4) AS score
  FROM base_conocimiento_enel
  WHERE embedding_local IS NOT NULL
    AND es_exitosa = TRUE
    ${filtrarCategoria ? 'AND categoria ILIKE $4' : ''}
  ORDER BY score DESC
  LIMIT $3;
`;

export const buscarContextoLegal = async (vectorTutelaLocal, textoOriginal = '', limit = 5, categoria = null) => {
  if (!vectorTutelaLocal || !Array.isArray(vectorTutelaLocal) || vectorTutelaLocal.length === 0) {
    throw new Error('Vector inválido o vacío');
  }

  try {
    const texto = textoOriginal || '';

    // Búsqueda filtrada por categoría si se conoce el derecho vulnerado
    if (categoria?.trim()) {
      const params = [JSON.stringify(vectorTutelaLocal), texto, limit, `%${categoria}%`];
      const { rows } = await pool.query(SCORING_QUERY(true), params);

      // Si hay suficientes resultados filtrados, los retorna directamente
      if (rows.length >= 3) return rows;

      // Si hay pocos, completa con búsqueda sin filtro excluyendo los ya encontrados
      const idsEncontrados = rows.map(r => r.documento_id);
      const faltantes = limit - rows.length;
      const exclusion = idsEncontrados.length > 0
        ? `AND documento_id <> ALL(ARRAY[${idsEncontrados.map((_, i) => `$${i + 4}`).join(',')}]::uuid[])`
        : '';

      const queryComplemento = `
        SELECT categoria, titulo_referencia, contenido_legal, documento_id, relevancia_score,
               ROUND(CAST(
                 (1 - (embedding_local <=> $1)) * 0.55 +
                 LEAST(ts_rank(contenido_tsv, plainto_tsquery('spanish', $2)), 1.0) * 0.35 +
                 LEAST(GREATEST(relevancia_score, 0), 10) / 10.0 * 0.10
               AS NUMERIC), 4) AS score
        FROM base_conocimiento_enel
        WHERE embedding_local IS NOT NULL AND es_exitosa = TRUE
        ${exclusion}
        ORDER BY score DESC
        LIMIT $3;
      `;

      const paramsComplemento = [JSON.stringify(vectorTutelaLocal), texto, faltantes, ...idsEncontrados];
      const { rows: complemento } = await pool.query(queryComplemento, paramsComplemento);

      return [...rows, ...complemento];
    }

    // Sin categoría conocida: búsqueda global
    const { rows } = await pool.query(SCORING_QUERY(false), [JSON.stringify(vectorTutelaLocal), texto, limit]);
    return rows;

  } catch (error) {
    console.error('Error buscando en pgvector local:', error);
    throw new Error('Fallo al buscar casos previos localmente');
  }
};