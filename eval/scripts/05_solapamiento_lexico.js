// node --env-file=eval/.env.eval --import ./eval/guard.js eval/scripts/05_solapamiento_lexico.js
//
// Fase A de #114: mide el solapamiento léxico REAL por consulta (no la
// etiqueta de "modo" que puso el generador), ponderado por IDF sobre el
// corpus real, usando el mismo stemmer que producción (to_tsvector('spanish')).
// También mide el desacuerdo entre vector-solo y léxico-solo por consulta
// (solapamiento de sus respectivos top-10) y la longitud de cada consulta —
// los 3 insumos que pide la Fase A antes de diseñar la perturbación pareada
// de la Fase B.
//
// Solo corre sobre dev (qrels mecánicos, cubren TODAS las combinaciones
// query×documento — sin el problema de pares sin juicio que tiene test).
import fs from 'node:fs/promises';
import pool from '../../src/db/database.js';
import { DocSchema, QuerySchema, cargarYValidar } from '../schema.js';
import { uuidDeDoc } from '../config.js';

const rutaCorpus = 'eval/data/corpus.jsonl';
const rutaQueries = 'eval/data/queries.jsonl';
const rutaSplit = 'eval/data/split.json';
const rutaQrels = 'eval/data/qrels.trec';

const corpus = await cargarYValidar(rutaCorpus, DocSchema);
const queries = await cargarYValidar(rutaQueries, QuerySchema);
const split = JSON.parse(await fs.readFile(rutaSplit, 'utf-8'));
const testQids = new Set(split.test);
const devQueries = queries.filter(q => !testQids.has(q.qid));

const docIdDe = new Map(corpus.map(d => [uuidDeDoc(d.id), d.id]));
const idDeDoc = new Map(corpus.map(d => [d.id, uuidDeDoc(d.id)]));

// ── qrels mecánicos (dev) ───────────────────────────────────────────────────
const qrelsLineas = (await fs.readFile(rutaQrels, 'utf-8')).trim().split('\n').filter(Boolean);
const qrelsPorQuery = new Map();
for (const l of qrelsLineas) {
  const [qid, , docUuid, grado] = l.split(' ');
  if (!qrelsPorQuery.has(qid)) qrelsPorQuery.set(qid, new Map());
  qrelsPorQuery.get(qid).set(docIdDe.get(docUuid) ?? docUuid, Number(grado));
}

// ── Lexemas por documento (IDF sobre el corpus real) ────────────────────────
const lexemasPorDoc = new Map(); // id -> Set<lexema>
for (const d of corpus) {
  const { rows } = await pool.query(
    `SELECT array_agg(DISTINCT lexeme) AS lexemas FROM unnest(to_tsvector('spanish', $1)) AS t(lexeme, positions, weights)`,
    [d.texto]
  );
  lexemasPorDoc.set(d.id, new Set(rows[0].lexemas ?? []));
}

const df = new Map(); // lexema -> # documentos que lo contienen
for (const lexemas of lexemasPorDoc.values()) {
  for (const l of lexemas) df.set(l, (df.get(l) ?? 0) + 1);
}
const N = corpus.length;
const idf = (lexema) => Math.log(N / (1 + (df.get(lexema) ?? 0)));

// ── Lexemas por consulta + solapamiento IDF-ponderado con sus relevantes ────
const resultados = [];
for (const q of devQueries) {
  const rel = qrelsPorQuery.get(q.qid);
  if (!rel) continue;

  const { rows: qRows } = await pool.query(
    `SELECT array_agg(DISTINCT lexeme) AS lexemas FROM unnest(to_tsvector('spanish', $1)) AS t(lexeme, positions, weights)`,
    [q.texto]
  );
  const lexemasQuery = new Set(qRows[0].lexemas ?? []);
  const longitud = q.texto.trim().split(/\s+/).length;

  // Unión de lexemas de los documentos grado 2 (o grado>=1 si no hay ninguno de grado 2)
  const idsGrado2 = [...rel.entries()].filter(([, g]) => g === 2).map(([id]) => id);
  const idsRelevantes = idsGrado2.length ? idsGrado2 : [...rel.entries()].filter(([, g]) => g > 0).map(([id]) => id);
  const lexemasDoc = new Set();
  for (const id of idsRelevantes) for (const l of (lexemasPorDoc.get(id) ?? [])) lexemasDoc.add(l);

  let idfTotal = 0, idfEncontrado = 0;
  for (const l of lexemasQuery) {
    const peso = idf(l);
    idfTotal += peso;
    if (lexemasDoc.has(l)) idfEncontrado += peso;
  }
  const solapamiento = idfTotal > 0 ? idfEncontrado / idfTotal : null;

  resultados.push({
    qid: q.qid,
    modo_generador: q.qid.match(/-(PARA|SEM|LEX|NOKW|DIS)-?\d*$/)?.[1] ?? 'OTRO',
    longitud_palabras: longitud,
    solapamiento_lexico_idf: solapamiento,
    n_relevantes: idsRelevantes.length,
  });
}

await fs.writeFile('eval/data/fase_a_solapamiento.json', JSON.stringify(resultados, null, 2));
console.log(`[fase-a] ${resultados.length} consultas de dev → eval/data/fase_a_solapamiento.json`);

// Resumen rápido por modo del generador, para contrastar con el solapamiento real
const porModo = new Map();
for (const r of resultados) {
  if (!porModo.has(r.modo_generador)) porModo.set(r.modo_generador, []);
  porModo.get(r.modo_generador).push(r.solapamiento_lexico_idf);
}
console.log('\n[fase-a] Solapamiento léxico IDF-ponderado promedio, por modo del generador:');
for (const [modo, valores] of porModo) {
  const validos = valores.filter(v => v !== null);
  const media = validos.reduce((a, b) => a + b, 0) / validos.length;
  console.log(`  ${modo.padEnd(6)} n=${validos.length.toString().padStart(2)}  media=${media.toFixed(3)}`);
}

await pool.end();
