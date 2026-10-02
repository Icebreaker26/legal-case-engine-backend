// node --env-file=eval/.env.eval --import ./eval/guard.js eval/scripts/00_ablation_modelo_ventana.js
//
// Experimento 2x2 para desambiguar las dos hipótesis de #95 sobre la señal
// semántica débil: ¿es la ventana de tokens (MiniLM entrenado con
// max_seq_length=256, chunks reales con mediana de 351 tokens) o la calidad
// del modelo en sí (MiniLM, entrenado mayormente en inglés)?
//
//            | largo completo (actual) | truncado a 256 tokens |
// MiniLM     | baseline actual          | solo arregla ventana  |
// e5-small   | solo arregla modelo      | arregla ambos         |
//
// Puramente en memoria (sin tocar la tabla real de rag-eval-db): recalcula
// los mismos 53 chunks del corpus v1 (limpiarTexto + dividirEnChunks, igual
// que memoriaService.indexarDocumento), genera embeddings con cada modelo
// y con/sin truncar, rankea por similitud coseno (vector-solo, sin fusión
// léxica — igual que ablation-vector-only.trec) y escribe 4 runs TREC.
//
// Nota metodológica: los qrels de este corpus favorecen coincidencia léxica
// (ver riesgo de circularidad documentado en el doc de seguimiento) — una
// ganancia chica acá probablemente subestima la ganancia semántica real.
import fs from 'node:fs/promises';
import path from 'node:path';
import { pipeline, AutoTokenizer } from '@xenova/transformers';
import pool from '../../src/db/database.js';
import { limpiarTexto } from '../../src/modules/tutelas/services/cleanerService.js';
import { dividirEnChunks } from '../../src/modules/tutelas/services/chunkService.js';
import { DocSchema, QuerySchema, cargarYValidar } from '../schema.js';

const rutaCorpus = 'eval/data/corpus.jsonl';
const rutaQueries = 'eval/data/queries.jsonl';
const dirResultados = 'eval/data/runs';
const LIMIT = 10;
const VENTANA = 256;

const MODELOS = {
  minilm: { id: 'Xenova/all-MiniLM-L6-v2', prefijoQuery: '', prefijoPassage: '' },
  e5: { id: 'Xenova/multilingual-e5-small', prefijoQuery: 'query: ', prefijoPassage: 'passage: ' },
};

const corpus = await cargarYValidar(rutaCorpus, DocSchema);
const queries = (await cargarYValidar(rutaQueries, QuerySchema)).sort((a, b) => a.qid.localeCompare(b.qid));

// ── Reconstruir los mismos 53 chunks que están indexados hoy, con su docId legible ──
const chunksPorDoc = [];
for (const d of corpus) {
  const textoLimpio = await limpiarTexto(d.texto);
  const chunks = dividirEnChunks(textoLimpio, 1500, 300);
  chunks.forEach((c, i) => chunksPorDoc.push({ docId: d.id, chunkIdx: i, texto: c }));
}
console.log(`[2x2] ${chunksPorDoc.length} chunks reconstruidos de ${corpus.length} documentos.`);

// ── Truncar un texto a `maxTokens` tokens exactos (binary search sobre caracteres) ──
const truncarATokens = async (tokenizer, texto, maxTokens) => {
  const encCompleto = await tokenizer(texto);
  if (encCompleto.input_ids.data.length <= maxTokens) return texto;
  let lo = 0, hi = texto.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi + 1) / 2);
    const enc = await tokenizer(texto.slice(0, mid));
    if (enc.input_ids.data.length <= maxTokens) lo = mid; else hi = mid - 1;
  }
  return texto.slice(0, lo);
};

const cosine = (a, b) => {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // los vectores ya vienen normalizados (normalize: true) → dot = coseno
};

const correrCelda = async (nombreModelo, truncar) => {
  const { id: modeloId, prefijoQuery, prefijoPassage } = MODELOS[nombreModelo];
  console.log(`\n[2x2] cargando ${modeloId}...`);
  const extractor = await pipeline('feature-extraction', modeloId);
  const tokenizer = truncar ? await AutoTokenizer.from_pretrained(modeloId) : null;

  const embed = async (texto, prefijo) => {
    const t = truncar ? await truncarATokens(tokenizer, texto, VENTANA) : texto;
    const out = await extractor(`${prefijo}${t}`, { pooling: 'mean', normalize: true });
    return Array.from(out.data);
  };

  const vectoresChunks = [];
  for (const c of chunksPorDoc) {
    vectoresChunks.push({ ...c, vector: await embed(c.texto, prefijoPassage) });
  }

  const lineasTrec = [];
  for (const q of queries) {
    const textoQuery = await limpiarTexto(q.texto);
    const vq = await embed(textoQuery, prefijoQuery);

    const mejorPorDoc = new Map();
    for (const c of vectoresChunks) {
      const score = cosine(vq, c.vector);
      const actual = mejorPorDoc.get(c.docId);
      if (!actual || score > actual.score) mejorPorDoc.set(c.docId, { score, docId: c.docId });
    }
    const ranking = [...mejorPorDoc.values()].sort((a, b) => b.score - a.score).slice(0, LIMIT);
    ranking.forEach((r, i) => lineasTrec.push(`${q.qid} Q0 ${r.docId} ${i + 1} ${LIMIT - i} 2x2-${nombreModelo}-${truncar ? 'trunc256' : 'full'}`));
  }

  const nombreArchivo = `ablation-2x2-${nombreModelo}-${truncar ? 'trunc256' : 'full'}`;
  const ruta = path.join(dirResultados, `${nombreArchivo}.trec`);
  await fs.writeFile(ruta, lineasTrec.join('\n') + (lineasTrec.length ? '\n' : ''));
  console.log(`[2x2] ${nombreArchivo}: ${lineasTrec.length} líneas → ${ruta}`);
};

for (const nombreModelo of ['minilm', 'e5']) {
  for (const truncar of [false, true]) {
    await correrCelda(nombreModelo, truncar);
  }
}

await pool.end();
