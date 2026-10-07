// node --env-file=eval/.env.eval --import ./eval/guard.js eval/scripts/v2_verificar_casi_duplicados.js
//
// #115 (Fase D): verifica que los pares "casi_duplicado" del corpus v2 (mismo
// spec, vocabulario deliberadamente disjunto) realmente tengan solapamiento
// léxico bajo, con el mismo stemmer to_tsvector('spanish') que usa producción
// — no a ojo. Reporta el Jaccard real, no asume cero.
import fs from 'node:fs/promises';
import pool from '../../src/db/database.js';
import { DocSchema, cargarYValidar } from '../schema.js';

const rutaCorpus = process.argv[2] ?? 'eval/data/v2/corpus_v2.jsonl';
const docs = await cargarYValidar(rutaCorpus, DocSchema);
const porId = new Map(docs.map(d => [d.id, d]));
const pares = [...new Set(docs.filter(d => d.id.includes('-DUP-')).map(d => d.id.replace(/[AB]$/, '')))];

const lexemasDe = async (texto) => {
  const { rows } = await pool.query(
    `SELECT array_agg(DISTINCT lexeme) AS lexemas FROM unnest(to_tsvector('spanish', $1)) AS t(lexeme, positions, weights)`,
    [texto]
  );
  return new Set(rows[0].lexemas ?? []);
};

for (const base of pares) {
  const a = porId.get(`${base}A`);
  const b = porId.get(`${base}B`);
  if (!a || !b) { console.warn(`[dup] par incompleto: ${base}`); continue; }
  const lexA = await lexemasDe(a.texto);
  const lexB = await lexemasDe(b.texto);
  const compartidos = [...lexA].filter(l => lexB.has(l));
  const jaccard = compartidos.length / new Set([...lexA, ...lexB]).size;
  console.log(`${base}: |A|=${lexA.size} |B|=${lexB.size} compartidos=${compartidos.length} jaccard=${jaccard.toFixed(3)}`);
  if (compartidos.length) console.log('   compartidos:', compartidos);
}

await pool.end();
