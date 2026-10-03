// node --env-file=eval/.env.eval --import ./eval/guard.js eval/scripts/05e_diagnostico_hipotesis.js
//
// Diagnóstico para distinguir las 3 hipótesis sobre por qué la Fase B
// (piloto de perturbación pareada) no replicó la correlación de la Fase A:
//   H1: el solapamiento léxico natural es un confusor, no la causa real.
//   H2: las reescrituras B diluyeron la fidelidad semántica, no solo el
//       vocabulario superficial.
//   H3: e5-small no es robusto a paráfrasis fuerte en este dominio.
//
// Requiere rag-eval-db indexado con multilingual-e5-small.
import fs from 'node:fs/promises';
import pool from '../../src/db/database.js';
import { limpiarTexto } from '../../src/modules/tutelas/services/cleanerService.js';
import { generarEmbeddingLocal } from '../../src/modules/tutelas/services/aiService.js';
import { DocSchema, QuerySchema, cargarYValidar } from '../schema.js';
import { uuidDeDoc } from '../config.js';

const corpus = await cargarYValidar('eval/data/corpus.jsonl', DocSchema);
const queries = await cargarYValidar('eval/data/queries.jsonl', QuerySchema);
const docIdDe = new Map(corpus.map(d => [uuidDeDoc(d.id), d.id]));
const queryPorQid = new Map(queries.map(q => [q.qid, q]));
const pares = JSON.parse(await fs.readFile('eval/data/fase_b_pares_piloto.json', 'utf-8'));
const faseA = JSON.parse(await fs.readFile('eval/data/fase_a_analisis_completo.json', 'utf-8'));
const faseAporQid = new Map(faseA.map(f => [f.qid, f]));

const VECTOR_ONLY_DEDUP = `
  WITH scored AS (
    SELECT documento_id,
      1 - (embedding_local <=> $1::vector) AS score,
      ROW_NUMBER() OVER (PARTITION BY documento_id ORDER BY embedding_local <=> $1::vector) AS rn
    FROM base_conocimiento_enel
    WHERE embedding_local IS NOT NULL AND es_exitosa = TRUE AND is_active = TRUE AND documento_id IS NOT NULL
  )
  SELECT documento_id, score FROM scored WHERE rn = 1 ORDER BY score DESC LIMIT 10;
`;
const LEXICAL_ONLY_DEDUP = `
  WITH scored AS (
    SELECT documento_id,
      ts_rank(contenido_tsv, plainto_tsquery('spanish', $1)) AS score,
      ROW_NUMBER() OVER (PARTITION BY documento_id ORDER BY ts_rank(contenido_tsv, plainto_tsquery('spanish', $1)) DESC) AS rn
    FROM base_conocimiento_enel
    WHERE embedding_local IS NOT NULL AND es_exitosa = TRUE AND is_active = TRUE AND documento_id IS NOT NULL
  )
  SELECT documento_id, score FROM scored WHERE rn = 1 ORDER BY score DESC LIMIT 10;
`;

const coseno = (a, b) => {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
};

const top10DocIdsVector = async (vector) => {
  const { rows } = await pool.query(VECTOR_ONLY_DEDUP, [JSON.stringify(vector)]);
  return new Set(rows.map(r => r.documento_id));
};
const top10DocIdsLexico = async (texto) => {
  const { rows } = await pool.query(LEXICAL_ONLY_DEDUP, [texto]);
  return new Set(rows.map(r => r.documento_id));
};

const resultados = [];
for (const par of pares) {
  const q = queryPorQid.get(par.qid);
  const fa = faseAporQid.get(par.qid);

  const textoA = await limpiarTexto(q.texto);
  const textoB = await limpiarTexto(par.texto_b);

  // H2/H3: similitud coseno entre embed(A) y embed(B) directamente
  const embA = await generarEmbeddingLocal(textoA, { tipo: 'query' });
  const embB = await generarEmbeddingLocal(textoB, { tipo: 'query' });
  const similitudAB = coseno(embA, embB);

  // H1: desacuerdo vector/léxico de B — ¿se movió en la dirección esperada?
  const vecTopB = await top10DocIdsVector(embB);
  const lexTopB = await top10DocIdsLexico(textoB);
  const inter = [...vecTopB].filter(d => lexTopB.has(d)).length;
  const union = new Set([...vecTopB, ...lexTopB]).size || 1;
  const desacuerdoB = 1 - inter / union;

  resultados.push({
    qid: par.qid,
    desacuerdo_A: fa.desacuerdo_vector_lexico,
    desacuerdo_B: desacuerdoB,
    cambio_desacuerdo: desacuerdoB - fa.desacuerdo_vector_lexico,
    similitud_coseno_AB: similitudAB,
  });
  console.log(`${par.qid.padEnd(18)} desacuerdo A=${fa.desacuerdo_vector_lexico.toFixed(2)} B=${desacuerdoB.toFixed(2)} (${desacuerdoB > fa.desacuerdo_vector_lexico ? '+' : ''}${(desacuerdoB - fa.desacuerdo_vector_lexico).toFixed(2)})  similitud_AB=${similitudAB.toFixed(3)}`);
}

await fs.writeFile('eval/data/fase_b_diagnostico.json', JSON.stringify(resultados, null, 2));

const cambios = resultados.map(r => r.cambio_desacuerdo);
const mediaCambio = cambios.reduce((a, b) => a + b, 0) / cambios.length;
const positivos = cambios.filter(c => c > 0).length;
console.log(`\nCambio promedio en desacuerdo (A->B): ${mediaCambio >= 0 ? '+' : ''}${mediaCambio.toFixed(3)}  (${positivos}/${cambios.length} aumentaron, esperado si H1 es relevante)`);

const similitudes = resultados.map(r => r.similitud_coseno_AB);
const mediaSim = similitudes.reduce((a, b) => a + b, 0) / similitudes.length;
console.log(`Similitud coseno promedio embed(A) vs embed(B): ${mediaSim.toFixed(3)} (alta si las reescrituras preservaron el significado para el modelo)`);

await pool.end();
