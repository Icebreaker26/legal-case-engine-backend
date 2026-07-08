import pool from '../../../db/database.js';
import { generarEmbedding } from '../../tutelas/services/aiService.js';
import logger from '../../../utils/logger.js';

const UMBRAL_SIMILITUD = 0.65;

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
    `SELECT embedding FROM embeddings_ambiental WHERE expediente_id = $1`,
    [expedienteId]
  );
  if (!embRows.length) return null;

  const { rows } = await pool.query(
    `SELECT
       e.id, e.titulo, e.numero_expediente, e.tipo_instrumento, e.estado,
       ent.nombre AS entidad_nombre,
       a.nivel_riesgo, a.resumen,
       ROUND(CAST((1 - (ea.embedding <=> $1)) AS NUMERIC), 4) AS similitud
     FROM embeddings_ambiental ea
     JOIN expedientes_ambientales e ON e.id = ea.expediente_id
     LEFT JOIN global_entidades ent ON ent.id = e.entidad_id
     LEFT JOIN analisis_ambiental a ON a.expediente_id = e.id
     WHERE ea.expediente_id <> $2
       AND e.is_active = true
       AND (1 - (ea.embedding <=> $1)) >= $3
     ORDER BY similitud DESC
     LIMIT $4`,
    [embRows[0].embedding, expedienteId, UMBRAL_SIMILITUD, limite]
  );
  return rows;
};
