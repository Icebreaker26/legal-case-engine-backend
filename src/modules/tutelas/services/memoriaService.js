import { v4 as uuidv4 } from 'uuid';
import pool from '../../../db/database.js';
import { dividirEnChunks } from './chunkService.js';
import { generarEmbeddingLocal } from './aiService.js';

const insertarChunks = async (db, { chunks, vectores, categoria, titulo, esExitosa, documentoId, comprensionDoc, vectorComprension }) => {
  for (let i = 0; i < chunks.length; i++) {
    await db.query(
      `INSERT INTO base_conocimiento_enel
         (categoria, titulo_referencia, contenido_legal, embedding_local, es_exitosa, documento_id,
          comprension_doc, embedding_comprension)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        categoria,
        `${titulo} (${i + 1}/${chunks.length})`,
        chunks[i],
        JSON.stringify(vectores[i]),
        esExitosa,
        documentoId,
        comprensionDoc ? JSON.stringify(comprensionDoc) : null,
        vectorComprension ? JSON.stringify(vectorComprension) : null,
      ]
    );
  }
};

// #72 (Fase 1): una fila por documento_id, no por chunk -- el texto fuente
// íntegro es el mismo para todos los chunks de un documento. ON CONFLICT DO
// NOTHING es solo defensivo (documentoId siempre es nuevo en el uso actual,
// ver uuidv4() en la firma de indexarDocumento), no se espera que dispare.
const guardarTextoFuente = async (db, { documentoId, texto }) => {
  await db.query(
    `INSERT INTO documentos_fuente (documento_id, texto_fuente)
     VALUES ($1, $2)
     ON CONFLICT (documento_id) DO NOTHING`,
    [documentoId, texto]
  );
};

/**
 * Indexa un documento en base_conocimiento_enel: chunking + embeddings + insert.
 * Único punto de indexación — reemplaza la lógica que antes estaba duplicada
 * en actualizarDatosTutela, entrenarContextoLocal y promoverArgumento.
 *
 * Si se pasa `client`, se asume que el caller ya abrió una transacción (BEGIN)
 * y puede seguir usándola después (p.ej. para un UPDATE adicional antes del COMMIT).
 * Si no, esta función abre y cierra su propia transacción.
 */
export const indexarDocumento = async ({
  texto,
  categoria,
  titulo,
  documentoId = uuidv4(),
  esExitosa = true,
  comprensionDoc = null,
  client = null,
}) => {
  const chunks = dividirEnChunks(texto, 1500, 300);
  const vectores = await Promise.all(chunks.map(c => generarEmbeddingLocal(c)));

  const textoComprension = comprensionDoc
    ? `${comprensionDoc.que_resuelve}. ${(comprensionDoc.derechos_involucrados || []).join('. ')}`
    : null;
  const vectorComprension = textoComprension
    ? await generarEmbeddingLocal(textoComprension)
    : null;

  const params = { chunks, vectores, categoria, titulo, esExitosa, documentoId, comprensionDoc, vectorComprension };

  if (client) {
    await insertarChunks(client, params);
    await guardarTextoFuente(client, { documentoId, texto });
  } else {
    const ownClient = await pool.connect();
    try {
      await ownClient.query('BEGIN');
      await insertarChunks(ownClient, params);
      await guardarTextoFuente(ownClient, { documentoId, texto });
      await ownClient.query('COMMIT');
    } catch (err) {
      await ownClient.query('ROLLBACK');
      throw err;
    } finally {
      ownClient.release();
    }
  }

  return { documentoId, chunks: chunks.length };
};
