// node --env-file=eval/.env.eval --import ./eval/guard.js eval/scripts/00_ablation.js [--corpus ruta] [--queries ruta] [--out dir]
//
// Controles de plomería (#95) — corre ANTES de #77 (swap de modelo /
// tuning de pesos), para descartar que la "señal semántica débil" medida
// en el corpus v1 sea un problema de configuración y no del modelo.
//
// Genera 3 runs en formato TREC aislando cada señal de buildScoringCTE
// (vectorService.js) por separado, con SQL directo (no pasa por
// vectorService.js — es un diagnóstico, no reemplaza el pipeline real):
//   - ablation-vector-only   : solo similitud coseno
//   - ablation-lexical-only  : solo ts_rank
//   - ablation-sin-relevancia: fórmula ponderada completa pero con el
//                              término de relevancia_score en 0 (el 10%
//                              de peso que hoy es puro ruido sobre un
//                              corpus sin feedback real de abogado)
// Sin filtro de categoría en ninguna de las 3 — el objetivo es aislar la
// señal en sí, no reproducir el pipeline de producción completo (eso ya
// lo miden E01/E02).
//
// También imprime los rangos crudos (min/p50/p90/max) de cada señal sobre
// el corpus — los pesos fijos 0.55/0.35 de "ponderado" solo tienen sentido
// si ambas señales viven en rangos comparables.
import fs from 'node:fs/promises';
import path from 'node:path';
import pool from '../../src/db/database.js';
import { limpiarTexto } from '../../src/modules/tutelas/services/cleanerService.js';
import { generarEmbeddingLocal } from '../../src/modules/tutelas/services/aiService.js';
import { DocSchema, QuerySchema, cargarYValidar } from '../schema.js';
import { uuidDeDoc } from '../config.js';

const argv = Object.fromEntries(
  process.argv.slice(2).reduce((acc, arg, i, arr) => {
    if (arg.startsWith('--')) acc.push([arg.slice(2), arr[i + 1]]);
    return acc;
  }, [])
);

const rutaCorpus = argv.corpus ?? 'eval/fixtures/mini/corpus.jsonl';
const rutaQueries = argv.queries ?? 'eval/fixtures/mini/queries.jsonl';
const dirResultados = argv.out ?? 'eval/data/runs';
const LIMIT = 10;

const corpus = await cargarYValidar(rutaCorpus, DocSchema);
const queries = (await cargarYValidar(rutaQueries, QuerySchema)).sort((a, b) => a.qid.localeCompare(b.qid));
const docIdDe = new Map(corpus.map(d => [uuidDeDoc(d.id), d.id]));

const { rows: [ultimoIndexado] } = await pool.query(
  'SELECT modelo FROM eval_indexado ORDER BY id DESC LIMIT 1'
).catch(() => ({ rows: [null] }));
if (!ultimoIndexado) {
  console.error('[ablation] no hay registro en eval_indexado — corre primero 02_indexar.js');
  process.exit(1);
}

// ── Las 3 queries SQL aisladas (espejo de buildScoringCTE, sin fusión) ─────
const VECTOR_ONLY = `
  SELECT documento_id, titulo_referencia, 1 - (embedding_local <=> $1::vector) AS score
  FROM base_conocimiento_enel
  WHERE embedding_local IS NOT NULL AND es_exitosa = TRUE AND is_active = TRUE AND documento_id IS NOT NULL
  ORDER BY embedding_local <=> $1::vector
  LIMIT $2;
`;

const LEXICAL_ONLY = `
  SELECT documento_id, titulo_referencia, ts_rank(contenido_tsv, plainto_tsquery('spanish', $1)) AS score
  FROM base_conocimiento_enel
  WHERE embedding_local IS NOT NULL AND es_exitosa = TRUE AND is_active = TRUE AND documento_id IS NOT NULL
  ORDER BY score DESC
  LIMIT $2;
`;

const PONDERADO_SIN_RELEVANCIA = `
  WITH scored AS (
    SELECT documento_id, titulo_referencia,
      ROW_NUMBER() OVER (
        PARTITION BY documento_id
        ORDER BY (1 - (embedding_local <=> $1::vector)) * 0.55 + LEAST(ts_rank(contenido_tsv, plainto_tsquery('spanish', $2)), 1.0) * 0.35 DESC
      ) AS rn,
      (1 - (embedding_local <=> $1::vector)) * 0.55 + LEAST(ts_rank(contenido_tsv, plainto_tsquery('spanish', $2)), 1.0) * 0.35 AS score
    FROM base_conocimiento_enel
    WHERE embedding_local IS NOT NULL AND es_exitosa = TRUE AND is_active = TRUE AND documento_id IS NOT NULL
  )
  SELECT documento_id, titulo_referencia, score FROM scored WHERE rn = 1 ORDER BY score DESC LIMIT $3;
`;

const corridas = {
  'ablation-vector-only': [],
  'ablation-lexical-only': [],
  'ablation-sin-relevancia': [],
};

const rangosVector = [];
const rangosLexico = [];

for (const q of queries) {
  const texto = await limpiarTexto(q.texto);
  const vector = await generarEmbeddingLocal(texto, { tipo: 'query' });
  const vectorParam = JSON.stringify(vector);

  const { rows: vecRows } = await pool.query(VECTOR_ONLY, [vectorParam, LIMIT]);
  vecRows.forEach((r, i) => corridas['ablation-vector-only'].push(
    `${q.qid} Q0 ${docIdDe.get(r.documento_id) ?? r.documento_id} ${i + 1} ${LIMIT - i} ablation-vector-only`
  ));

  const { rows: lexRows } = await pool.query(LEXICAL_ONLY, [texto, LIMIT]);
  lexRows.forEach((r, i) => corridas['ablation-lexical-only'].push(
    `${q.qid} Q0 ${docIdDe.get(r.documento_id) ?? r.documento_id} ${i + 1} ${LIMIT - i} ablation-lexical-only`
  ));

  const { rows: ponRows } = await pool.query(PONDERADO_SIN_RELEVANCIA, [vectorParam, texto, LIMIT]);
  ponRows.forEach((r, i) => corridas['ablation-sin-relevancia'].push(
    `${q.qid} Q0 ${docIdDe.get(r.documento_id) ?? r.documento_id} ${i + 1} ${LIMIT - i} ablation-sin-relevancia`
  ));

  // ── Rangos crudos: todas las filas candidatas para esta query, sin LIMIT ──
  const { rows: todasVec } = await pool.query(
    `SELECT 1 - (embedding_local <=> $1::vector) AS score FROM base_conocimiento_enel
     WHERE embedding_local IS NOT NULL AND es_exitosa = TRUE AND is_active = TRUE AND documento_id IS NOT NULL`,
    [vectorParam]
  );
  const { rows: todasLex } = await pool.query(
    `SELECT ts_rank(contenido_tsv, plainto_tsquery('spanish', $1)) AS score FROM base_conocimiento_enel
     WHERE embedding_local IS NOT NULL AND es_exitosa = TRUE AND is_active = TRUE AND documento_id IS NOT NULL`,
    [texto]
  );
  rangosVector.push(...todasVec.map(r => Number(r.score)));
  rangosLexico.push(...todasLex.map(r => Number(r.score)));
}

await fs.mkdir(dirResultados, { recursive: true });
for (const [nombre, lineas] of Object.entries(corridas)) {
  const ruta = path.join(dirResultados, `${nombre}.trec`);
  await fs.writeFile(ruta, lineas.join('\n') + (lineas.length ? '\n' : ''));
  console.log(`[ablation] ${nombre}: ${lineas.length} líneas → ${ruta}`);
}

const stats = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  const pct = (p) => s[Math.floor(p * (s.length - 1))];
  return { min: s[0], p50: pct(0.5), p90: pct(0.9), max: s[s.length - 1] };
};

console.log('\n[ablation] rangos crudos por señal (todas las filas candidatas, todas las queries):');
console.log('  vectorial (coseno) :', stats(rangosVector));
console.log('  léxico (ts_rank)   :', stats(rangosLexico));

await pool.end();
