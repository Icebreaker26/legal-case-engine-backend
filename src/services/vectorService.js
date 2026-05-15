import pool from '../db/database.js';

/**
 * Busca fragmentos legales similares usando el motor local (384 dimensiones).
 * Solo devuelve casos marcados como exitosos para garantizar calidad.
 */
export const buscarContextoLegal = async (vectorTutelaLocal, textoOriginal = '') => {
  try {
    const query = `
      SELECT categoria, titulo_referencia, contenido_legal, documento_id, 
             ((1 - (embedding_local <=> $1)) * 0.6 + 
             (ts_rank(to_tsvector('spanish', contenido_legal), plainto_tsquery('spanish', $2)) * 0.4)) as score
      FROM base_conocimiento_enel 
      WHERE embedding_local IS NOT NULL 
        AND es_exitosa = TRUE
      ORDER BY score DESC 
      LIMIT 5;
    `;
    
    const { rows } = await pool.query(query, [JSON.stringify(vectorTutelaLocal), textoOriginal]);
    
    return rows;
  } catch (error) {
    console.error('Error buscando en pgvector local:', error);
    throw new Error('Fallo al buscar casos previos localmente');
  }
};