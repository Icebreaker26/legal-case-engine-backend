import pool from '../../../db/database.js';
import { generarEmbedding } from '../../tutelas/services/aiService.js';
import logger from '../../../utils/logger.js';

const RRF_K = 60;
const CANDIDATOS = 20;

export const guardarEmbedding = async (expedienteId, texto, fuente) => {
  try {
    const fragmento = texto.slice(0, 1500);
    const vector = await generarEmbedding(fragmento);
    await pool.query(
      `INSERT INTO embeddings_ambiental (expediente_id, embedding, fuente)
       VALUES ($1, $2, $3)
       ON CONFLICT (expediente_id) DO UPDATE
         SET embedding = EXCLUDED.embedding,
             fuente = EXCLUDED.fuente,
             created_at = NOW()`,
      [expedienteId, JSON.stringify(vector), fuente]
    );
  } catch (err) {
    logger.error('guardarEmbedding ambiental error', { error: err.message, expedienteId });
  }
};

export const buscarSimilares = async (expedienteId, limite = 5) => {
  const { rows: embRows } = await pool.query(
    `SELECT ea.embedding, e.titulo, e.que_ordena, a.resumen
     FROM embeddings_ambiental ea
     JOIN expedientes_ambientales e ON e.id = ea.expediente_id
     LEFT JOIN LATERAL (
       SELECT resumen FROM analisis_ambiental
       WHERE expediente_id = e.id
       ORDER BY created_at DESC LIMIT 1
     ) a ON true
     WHERE ea.expediente_id = $1`,
    [expedienteId]
  );
  if (!embRows.length) return null;

  const { embedding } = embRows[0];

  // Texto de búsqueda full-text: resumen del análisis si existe, si no título + que_ordena
  const textoFT = [embRows[0].resumen, embRows[0].titulo, embRows[0].que_ordena]
    .filter(Boolean)
    .join(' ')
    .slice(0, 500);

  // Sin texto útil — solo búsqueda vectorial
  if (!textoFT.trim()) {
    const { rows: soloVector } = await pool.query(
      `SELECT
         e.id, e.titulo, e.numero_expediente, e.tipo_instrumento, e.estado,
         ent.nombre AS entidad_nombre,
         a.nivel_riesgo, a.resumen,
         ROUND(CAST((1 - (ea.embedding <=> $1)) AS NUMERIC), 4) AS similitud,
         ROUND(CAST((1 - (ea.embedding <=> $1)) AS NUMERIC), 4) AS rrf_score
       FROM embeddings_ambiental ea
       JOIN expedientes_ambientales e ON e.id = ea.expediente_id
       LEFT JOIN global_entidades ent ON ent.id = e.entidad_id
       LEFT JOIN LATERAL (
         SELECT nivel_riesgo, resumen FROM analisis_ambiental
         WHERE expediente_id = e.id
         ORDER BY created_at DESC LIMIT 1
       ) a ON true
       WHERE ea.expediente_id <> $2 AND e.is_active = true
       ORDER BY similitud DESC
       LIMIT $3`,
      [embedding, expedienteId, limite]
    );
    return soloVector;
  }

  const { rows } = await pool.query(
    `WITH vector_results AS (
       SELECT ea.expediente_id,
              ROW_NUMBER() OVER (ORDER BY ea.embedding <=> $1) AS rank
       FROM embeddings_ambiental ea
       JOIN expedientes_ambientales e ON e.id = ea.expediente_id
       WHERE ea.expediente_id <> $2
         AND e.is_active = true
       ORDER BY ea.embedding <=> $1
       LIMIT $3
     ),
     text_results AS (
       SELECT e.id AS expediente_id,
              ROW_NUMBER() OVER (ORDER BY ts_rank(e.search_vector, query) DESC) AS rank
       FROM expedientes_ambientales e,
            plainto_tsquery('spanish', $4) query
       WHERE e.search_vector @@ query
         AND e.id <> $2
         AND e.is_active = true
       ORDER BY ts_rank(e.search_vector, query) DESC
       LIMIT $3
     ),
     fused AS (
       SELECT
         COALESCE(v.expediente_id, t.expediente_id) AS expediente_id,
         (1.0 / ($5 + COALESCE(v.rank, $3 + 1)) +
          1.0 / ($5 + COALESCE(t.rank, $3 + 1))) AS rrf_score,
         ROUND(CAST((1 - (ea.embedding <=> $1)) AS NUMERIC), 4) AS similitud
       FROM vector_results v
       FULL OUTER JOIN text_results t ON t.expediente_id = v.expediente_id
       JOIN embeddings_ambiental ea ON ea.expediente_id = COALESCE(v.expediente_id, t.expediente_id)
     )
     SELECT
       e.id, e.titulo, e.numero_expediente, e.tipo_instrumento, e.estado,
       ent.nombre AS entidad_nombre,
       a.nivel_riesgo, a.resumen,
       f.similitud,
       ROUND(CAST(f.rrf_score * 1000 AS NUMERIC), 4) AS rrf_score
     FROM fused f
     JOIN expedientes_ambientales e ON e.id = f.expediente_id
     LEFT JOIN global_entidades ent ON ent.id = e.entidad_id
     LEFT JOIN LATERAL (
       SELECT nivel_riesgo, resumen FROM analisis_ambiental
       WHERE expediente_id = e.id
       ORDER BY created_at DESC LIMIT 1
     ) a ON true
     ORDER BY f.rrf_score DESC
     LIMIT $6`,
    [embedding, expedienteId, CANDIDATOS, textoFT, RRF_K, limite]
  );

  return rows;
};
