import pool from '../../../db/database.js';
import { generarEmbedding, generarEmbeddingLocal } from '../../tutelas/services/aiService.js';
import { dividirEnChunks } from '../../tutelas/services/chunkService.js';
import { env } from '../../../config/env.js';
import logger from '../../../utils/logger.js';

const RRF_K = 60;
const CANDIDATOS = 20;

// ── Trozos indexados (#195, épica #199) ──────────────────────────────────────
//
// Mismo camino de indexación que tutelas: trozos de 1.500 caracteres con
// solape de 300 (chunkService.js) y vectores generados con prefijo
// `passage: ` cuando el modelo es e5 (aiService.js). Cada trozo registra el
// modelo que lo generó (`embedding_modelo`), para que la búsqueda de #196
// pueda exigir con una guarda que todo esté indexado con el modelo validado.
//
// `embeddings_ambiental` (un vector por expediente) se sigue escribiendo
// igual con `guardarEmbedding`: es lo que lee `buscarSimilares` hasta #196.

export const TROZO_TAMANO = 1500;
export const TROZO_SOLAPE = 300;
export const FUENTES_TROZOS = ['contenido', 'analisis'];

/**
 * Texto vigente de cada fuente de un expediente activo, leído de la base:
 * `contenido` = contenido_texto completo; `analisis` = último resumen +
 * que_ordena (el mismo texto que ya usaba `guardarEmbedding` para 'analisis').
 * Devuelve null si el expediente no existe o está inactivo.
 */
export const leerTextosExpediente = async (expedienteId, db = pool) => {
  const { rows } = await db.query(
    `SELECT e.contenido_texto, e.que_ordena, a.resumen
     FROM expedientes_ambientales e
     LEFT JOIN LATERAL (
       SELECT resumen FROM analisis_ambiental
       WHERE expediente_id = e.id
       ORDER BY created_at DESC LIMIT 1
     ) a ON true
     WHERE e.id = $1 AND e.is_active = TRUE`,
    [expedienteId]
  );
  if (!rows.length) return null;
  const { contenido_texto, que_ordena, resumen } = rows[0];
  const limpio = (t) => (t && t.trim() ? t : null);
  return {
    contenido: limpio(contenido_texto),
    analisis: limpio(resumen) ? [resumen, que_ordena].filter(Boolean).join(' ') : null,
  };
};

/**
 * Reemplaza los trozos activos de una fuente de un expediente por los del
 * texto dado. Los vectores se generan antes de abrir la transacción; dentro
 * de ella, cada posición reutiliza su fila (UPDATE, se reactiva si estaba
 * inactiva) o se inserta, y las posiciones que sobran se desactivan
 * (borrado lógico). Así el número de filas por expediente no crece con cada
 * reindexación y la operación es idempotente.
 *
 * Lanza si falla: quien la llama decide si registra y sigue.
 */
export const indexarTrozos = async (expedienteId, texto, fuente, db = pool) => {
  if (!FUENTES_TROZOS.includes(fuente)) throw new Error(`fuente inválida: ${fuente}`);

  const trozos = texto ? dividirEnChunks(texto, TROZO_TAMANO, TROZO_SOLAPE) : [];
  const modelo = env.EMBEDDING_MODEL;
  const vectores = [];
  for (const trozo of trozos) {
    vectores.push(await generarEmbeddingLocal(trozo, { tipo: 'passage' }));
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { rows: existentes } = await client.query(
      `SELECT DISTINCT ON (chunk_index) id, chunk_index
       FROM chunks_ambiental
       WHERE expediente_id = $1 AND fuente = $2
       ORDER BY chunk_index, is_active DESC, updated_at DESC`,
      [expedienteId, fuente]
    );
    const filaPorIndice = new Map(existentes.map((r) => [r.chunk_index, r.id]));

    for (let i = 0; i < trozos.length; i++) {
      const id = filaPorIndice.get(i);
      if (id) {
        await client.query(
          `UPDATE chunks_ambiental
           SET contenido = $1, embedding = $2::vector, embedding_modelo = $3, is_active = TRUE, updated_at = NOW()
           WHERE id = $4`,
          [trozos[i], JSON.stringify(vectores[i]), modelo, id]
        );
      } else {
        await client.query(
          `INSERT INTO chunks_ambiental (expediente_id, chunk_index, contenido, embedding, embedding_modelo, fuente)
           VALUES ($1, $2, $3, $4::vector, $5, $6)`,
          [expedienteId, i, trozos[i], JSON.stringify(vectores[i]), modelo, fuente]
        );
      }
    }

    await client.query(
      `UPDATE chunks_ambiental SET is_active = FALSE, updated_at = NOW()
       WHERE expediente_id = $1 AND fuente = $2 AND chunk_index >= $3 AND is_active = TRUE`,
      [expedienteId, fuente, trozos.length]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }

  return { fuente, trozos: trozos.length, modelo };
};

/**
 * Reindexa las dos fuentes de un expediente a partir de lo que hay en la
 * base. Un expediente inactivo o inexistente no se toca. Lanza si falla.
 */
export const reindexarTrozosExpediente = async (expedienteId, db = pool) => {
  const textos = await leerTextosExpediente(expedienteId, db);
  if (!textos) return null;
  const resultado = {};
  for (const fuente of FUENTES_TROZOS) {
    resultado[fuente] = (await indexarTrozos(expedienteId, textos[fuente], fuente, db)).trozos;
  }
  return resultado;
};

/**
 * Lanza la reindexación en segundo plano, sin demorar la respuesta HTTP. Si
 * falla, queda en el log con el expediente, y el expediente se queda con
 * trozos desactualizados o sin trozos: es el estado que reporta
 * `scripts/reindexar_ambiental.js --dry-run`, y volver a correrlo lo repara.
 */
export const programarReindexacionTrozos = (expedienteId, motivo) => {
  setImmediate(async () => {
    try {
      await reindexarTrozosExpediente(expedienteId);
    } catch (err) {
      logger.error('chunks_ambiental: falló la indexación del expediente (queda pendiente para scripts/reindexar_ambiental.js)', {
        expedienteId, motivo, error: err.message,
      });
    }
  });
};

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
