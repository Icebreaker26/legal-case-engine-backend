import { v5 as uuidv5 } from 'uuid';

// Generado UNA vez (crypto.randomUUID()) y fijado para siempre — nunca
// regenerar. Los documento_id reales en base_conocimiento_enel son UUIDv5
// derivados de este namespace + el id legible del documento en el corpus
// (ej. 'DOC-FAC-001'), así que sobreviven a cualquier reindexado (cambio de
// modelo de embeddings, de chunking, etc.) sin que los qrels se rompan.
export const EVAL_NAMESPACE = '864594e0-93dd-442f-859b-ef5c75fcc960';

// docId = id legible del documento en el corpus (eval/data/corpus.jsonl),
// NUNCA incluye modelo, chunking ni versión — esos cambian entre corridas,
// el docId no debe cambiar con ellos.
export const uuidDeDoc = (docId) => uuidv5(docId, EVAL_NAMESPACE);
