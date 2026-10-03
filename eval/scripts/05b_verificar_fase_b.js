// node --env-file=eval/.env.eval --import ./eval/guard.js eval/scripts/05b_verificar_fase_b.js
//
// Verifica que las reescrituras de eval/data/fase_b_pares_piloto.json (Versión
// B del piloto de perturbación pareada, Fase B de #114) de verdad bajan el
// solapamiento léxico IDF-ponderado a casi cero frente a los documentos
// relevantes de dev — mismo cálculo que 05_solapamiento_lexico.js (Fase A),
// para que A y B sean comparables.
import fs from 'node:fs/promises';
import pool from '../../src/db/database.js';
import { DocSchema, QuerySchema, cargarYValidar } from '../schema.js';

const corpus = await cargarYValidar('eval/data/corpus.jsonl', DocSchema);
const queries = await cargarYValidar('eval/data/queries.jsonl', QuerySchema);
const qrelsLineas = (await fs.readFile('eval/data/qrels.trec', 'utf-8')).trim().split('\n').filter(Boolean);
const pares = JSON.parse(await fs.readFile('eval/data/fase_b_pares_piloto.json', 'utf-8'));

const { uuidDeDoc } = await import('../config.js');
const docIdDe = new Map(corpus.map(d => [uuidDeDoc(d.id), d.id]));
const qrelsPorQuery = new Map();
for (const l of qrelsLineas) {
  const [qid, , docUuid, grado] = l.split(' ');
  if (!qrelsPorQuery.has(qid)) qrelsPorQuery.set(qid, new Map());
  qrelsPorQuery.get(qid).set(docIdDe.get(docUuid) ?? docUuid, Number(grado));
}

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
const idf = (lexema) => Math.log(N / (1 + (df.get(lexema) ?? 0)));

const lexemasDe = async (texto) => {
  const { rows } = await pool.query(
    `SELECT array_agg(DISTINCT lexeme) AS lexemas FROM unnest(to_tsvector('spanish', $1)) AS t(lexeme, positions, weights)`,
    [texto]
  );
  return new Set(rows[0].lexemas ?? []);
};

const solapamiento = (lexemasQuery, lexemasDoc) => {
  let idfTotal = 0, idfEncontrado = 0;
  for (const l of lexemasQuery) {
    const peso = idf(l);
    idfTotal += peso;
    if (lexemasDoc.has(l)) idfEncontrado += peso;
  }
  return idfTotal > 0 ? idfEncontrado / idfTotal : null;
};

const queryPorQid = new Map(queries.map(q => [q.qid, q]));
console.log('qid'.padEnd(18), 'solap_A', 'solap_B', 'reduccion');
const resultados = [];
for (const par of pares) {
  const q = queryPorQid.get(par.qid);
  const rel = qrelsPorQuery.get(par.qid);
  const idsGrado2 = [...rel.entries()].filter(([, g]) => g === 2).map(([id]) => id);
  const idsRelevantes = idsGrado2.length ? idsGrado2 : [...rel.entries()].filter(([, g]) => g > 0).map(([id]) => id);
  const lexemasDoc = new Set();
  for (const id of idsRelevantes) for (const l of (lexemasPorDoc.get(id) ?? [])) lexemasDoc.add(l);

  const lexA = await lexemasDe(q.texto);
  const lexB = await lexemasDe(par.texto_b);
  const solapA = solapamiento(lexA, lexemasDoc);
  const solapB = solapamiento(lexB, lexemasDoc);
  resultados.push({ qid: par.qid, solap_a: solapA, solap_b: solapB, texto_b: par.texto_b });
  console.log(par.qid.padEnd(18), solapA?.toFixed(3) ?? 'n/a', '  ', solapB?.toFixed(3) ?? 'n/a', '  ', solapA && solapB ? `${(100*(1-solapB/solapA)).toFixed(0)}%` : '');
}

await fs.writeFile('eval/data/fase_b_verificacion.json', JSON.stringify(resultados, null, 2));
const mediaA = resultados.reduce((a, r) => a + (r.solap_a ?? 0), 0) / resultados.length;
const mediaB = resultados.reduce((a, r) => a + (r.solap_b ?? 0), 0) / resultados.length;
console.log(`\nMedia A: ${mediaA.toFixed(3)}  Media B: ${mediaB.toFixed(3)}`);

await pool.end();
