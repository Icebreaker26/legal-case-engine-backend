// node --env-file=eval/.env.eval eval/scripts/05f_confusor_documento.js
//
// Prueba el confusor del lado del documento, propuesto como explicación
// principal (H1) del resultado nulo de la Fase B: ¿los documentos de las
// consultas de bajo solapamiento NATURAL (Fase A) son, en sí mismos, más
// "aislados" en el espacio vectorial y/o más distintivos léxicamente que el
// resto del corpus — independientemente de cómo esté redactada la consulta?
//
// No requiere rag-eval-db — calcula embeddings directamente con
// generarEmbeddingLocal (igual que al indexar) y el solapamiento léxico con
// la misma fórmula IDF de 05_solapamiento_lexico.js, pero aplicada a pares
// documento-documento en vez de consulta-documento.
import fs from 'node:fs/promises';
import pool from '../../src/db/database.js';
import { generarEmbeddingLocal } from '../../src/modules/tutelas/services/aiService.js';
import { env } from '../../src/config/env.js';
import { DocSchema, QuerySchema, cargarYValidar } from '../schema.js';

console.log(`[confusor-doc] modelo: ${env.EMBEDDING_MODEL}`);

const corpus = await cargarYValidar('eval/data/corpus.jsonl', DocSchema);
const queries = await cargarYValidar('eval/data/queries.jsonl', QuerySchema);
const split = JSON.parse(await fs.readFile('eval/data/split.json', 'utf-8'));
const testQids = new Set(split.test);
const devQueries = queries.filter(q => !testQids.has(q.qid));

const qrelsLineas = (await fs.readFile('eval/data/qrels.trec', 'utf-8')).trim().split('\n').filter(Boolean);
const { uuidDeDoc } = await import('../config.js');
const docIdDe = new Map(corpus.map(d => [uuidDeDoc(d.id), d.id]));
const qrelsPorQuery = new Map();
for (const l of qrelsLineas) {
  const [qid, , docUuid, grado] = l.split(' ');
  if (!qrelsPorQuery.has(qid)) qrelsPorQuery.set(qid, new Map());
  qrelsPorQuery.get(qid).set(docIdDe.get(docUuid) ?? docUuid, Number(grado));
}

// ── 1. Embeddings de documento (passage) y matriz de distancia coseno ──────
const embPorDoc = new Map();
for (const d of corpus) {
  embPorDoc.set(d.id, await generarEmbeddingLocal(d.texto, { tipo: 'passage' }));
}
const coseno = (a, b) => {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
};

const aislamiento = new Map(); // doc.id -> { intraCategoria, global }
for (const d of corpus) {
  const mismaCategoria = corpus.filter(d2 => d2.id !== d.id && d2.categoria === d.categoria);
  const otros = corpus.filter(d2 => d2.id !== d.id);
  const distIntra = mismaCategoria.map(d2 => 1 - coseno(embPorDoc.get(d.id), embPorDoc.get(d2.id)));
  const distGlobal = otros.map(d2 => 1 - coseno(embPorDoc.get(d.id), embPorDoc.get(d2.id)));
  aislamiento.set(d.id, {
    intraCategoria: distIntra.length ? distIntra.reduce((a, b) => a + b, 0) / distIntra.length : null,
    global: distGlobal.reduce((a, b) => a + b, 0) / distGlobal.length,
  });
}

// ── 2. Distintividad léxica por documento (IDF propio, mismo corpus que #114 Fase A) ─
const lexemasPorDoc = new Map();
for (const d of corpus) {
  const { rows } = await pool.query(
    `SELECT array_agg(DISTINCT lexeme) AS lexemas FROM unnest(to_tsvector('spanish', $1)) AS t(lexeme, positions, weights)`,
    [d.texto]
  );
  lexemasPorDoc.set(d.id, new Set(rows[0].lexemas ?? []));
}
const df = new Map();
for (const lexemas of lexemasPorDoc.values()) for (const l of lexemas) df.set(l, (df.get(l) ?? 0) + 1);
const N = corpus.length;
const idf = (l) => Math.log(N / (1 + (df.get(l) ?? 0)));
const distintividadLexica = new Map();
for (const d of corpus) {
  const lexemas = [...lexemasPorDoc.get(d.id)];
  const media = lexemas.reduce((a, l) => a + idf(l), 0) / (lexemas.length || 1);
  distintividadLexica.set(d.id, media);
}

// ── 3. Unir con la Fase A: por consulta, aislamiento/distintividad de su doc grado 2 ─
const faseA = JSON.parse(await fs.readFile('eval/data/fase_a_analisis_completo.json', 'utf-8'));
const faseAporQid = new Map(faseA.map(f => [f.qid, f]));

const filas = [];
for (const q of devQueries) {
  const rel = qrelsPorQuery.get(q.qid);
  const fa = faseAporQid.get(q.qid);
  if (!rel || !fa || fa.solapamiento_lexico_idf == null) continue;
  const idsGrado2 = [...rel.entries()].filter(([, g]) => g === 2).map(([id]) => id);
  const idsRelevantes = idsGrado2.length ? idsGrado2 : [...rel.entries()].filter(([, g]) => g > 0).map(([id]) => id);

  const aislamientos = idsRelevantes.map(id => aislamiento.get(id)).filter(Boolean);
  const distintividades = idsRelevantes.map(id => distintividadLexica.get(id)).filter(v => v != null);
  if (!aislamientos.length) continue;

  filas.push({
    qid: q.qid,
    aislamiento_intra_categoria: aislamientos.reduce((a, b) => a + b.intraCategoria, 0) / aislamientos.length,
    aislamiento_global: aislamientos.reduce((a, b) => a + b.global, 0) / aislamientos.length,
    distintividad_lexica_doc: distintividades.reduce((a, b) => a + b, 0) / distintividades.length,
    solapamiento_lexico_query: fa.solapamiento_lexico_idf,
    diff_E03: fa.ndcg10_E03_produccion - fa.ndcg10_lexico,
  });
}

await fs.writeFile('eval/data/fase_c_confusor_documento.json', JSON.stringify(filas, null, 2));
console.log(`[confusor-doc] ${filas.length} consultas -> eval/data/fase_c_confusor_documento.json`);

const correl = (xs, ys) => {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); dx += (xs[i] - mx) ** 2; dy += (ys[i] - my) ** 2; }
  return num / Math.sqrt(dx * dy);
};

const aisloIntra = filas.map(f => f.aislamiento_intra_categoria);
const aisloGlobal = filas.map(f => f.aislamiento_global);
const distLex = filas.map(f => f.distintividad_lexica_doc);
const solapQuery = filas.map(f => f.solapamiento_lexico_query);
const diffs = filas.map(f => f.diff_E03);

console.log('\n=== Correlaciones (aislamiento/distintividad del DOCUMENTO) ===');
console.log(`  corr(aislamiento_intra_categoria, diff_E03)        = ${correl(aisloIntra, diffs).toFixed(3)}`);
console.log(`  corr(aislamiento_global, diff_E03)                 = ${correl(aisloGlobal, diffs).toFixed(3)}`);
console.log(`  corr(distintividad_lexica_doc, diff_E03)           = ${correl(distLex, diffs).toFixed(3)}`);
console.log(`  corr(aislamiento_intra_categoria, solapamiento_query) = ${correl(aisloIntra, solapQuery).toFixed(3)}`);
console.log(`  corr(distintividad_lexica_doc, solapamiento_query)    = ${correl(distLex, solapQuery).toFixed(3)}`);

await pool.end();
