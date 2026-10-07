// node --env-file=eval/.env.eval --import ./eval/guard.js eval/scripts/00_ponderado_normalizado.js
//
// Config 2 de #98 (RAG-Q1): ponderado con normalización min-max por consulta
// antes de aplicar los pesos fijos 0.55/0.35/0.10 — a diferencia de config 1
// (que usa buildScoringCTE tal cual, sobre scores crudos), esta variante
// normaliza cada señal al rango [0,1] usando el min/max de esa consulta
// específica antes de combinarlas. Necesario porque e5-small agrupa su
// similitud coseno en una banda alta y angosta, distinta a la de MiniLM.
//
// Requiere que rag-eval-db ya esté indexado con el modelo que se quiera
// probar (correr 02_indexar.js con EMBEDDING_MODEL=Xenova/multilingual-e5-small
// antes de este script).
//
// Simplificación metodológica (igual que en #95): sin filtro de categoría —
// aísla el efecto de la normalización, no reproduce el pipeline completo con
// el complemento de categoría de buscarPonderado.
import fs from 'node:fs/promises';
import path from 'node:path';
import pool from '../../src/db/database.js';
import { limpiarTexto } from '../../src/modules/tutelas/services/cleanerService.js';
import { generarEmbeddingLocal } from '../../src/modules/tutelas/services/aiService.js';
import { env } from '../../src/config/env.js';
import { DocSchema, QuerySchema, cargarYValidar } from '../schema.js';
import { uuidDeDoc } from '../config.js';

const rutaCorpus = 'eval/data/corpus.jsonl';
const rutaQueries = 'eval/data/queries.jsonl';
const dirResultados = 'eval/data/runs';
const LIMIT = 10;

const corpus = await cargarYValidar(rutaCorpus, DocSchema);
const queries = (await cargarYValidar(rutaQueries, QuerySchema)).sort((a, b) => a.qid.localeCompare(b.qid));
const docIdDe = new Map(corpus.map(d => [uuidDeDoc(d.id), d.id]));

const { rows: [ultimoIndexado] } = await pool.query(
  'SELECT modelo FROM eval_indexado ORDER BY id DESC LIMIT 1'
).catch(() => ({ rows: [null] }));
if (!ultimoIndexado) {
  console.error('[ponderado-norm] no hay registro en eval_indexado — corre primero 02_indexar.js');
  process.exit(1);
}
console.log(`[ponderado-norm] indexado con modelo="${ultimoIndexado.modelo}" (env.EMBEDDING_MODEL="${env.EMBEDDING_MODEL}")`);

const TODOS_LOS_CANDIDATOS = `
  SELECT documento_id,
         1 - (embedding_local <=> $1::vector) AS coseno,
         LEAST(ts_rank(contenido_tsv, plainto_tsquery('spanish', $2)), 1.0) AS ts_rank,
         LEAST(GREATEST(relevancia_score, 0), 10) / 10.0 AS relevancia
  FROM base_conocimiento_enel
  WHERE embedding_local IS NOT NULL AND es_exitosa = TRUE AND is_active = TRUE AND documento_id IS NOT NULL;
`;

const minMax = (valores) => {
  const min = Math.min(...valores), max = Math.max(...valores);
  const rango = max - min;
  return (v) => (rango > 1e-9 ? (v - min) / rango : 0);
};

const lineasTrec = [];

for (const q of queries) {
  const texto = await limpiarTexto(q.texto);
  const vector = await generarEmbeddingLocal(texto, { tipo: 'query' });
  const vectorParam = JSON.stringify(vector);

  const { rows } = await pool.query(TODOS_LOS_CANDIDATOS, [vectorParam, texto]);

  const normCoseno = minMax(rows.map(r => Number(r.coseno)));
  const normTsRank = minMax(rows.map(r => Number(r.ts_rank)));
  const normRelevancia = minMax(rows.map(r => Number(r.relevancia)));

  const mejorPorDoc = new Map();
  for (const r of rows) {
    const score = 0.55 * normCoseno(Number(r.coseno)) + 0.35 * normTsRank(Number(r.ts_rank)) + 0.10 * normRelevancia(Number(r.relevancia));
    const actual = mejorPorDoc.get(r.documento_id);
    if (!actual || score > actual.score) mejorPorDoc.set(r.documento_id, { score, documento_id: r.documento_id });
  }

  const ranking = [...mejorPorDoc.values()].sort((a, b) => b.score - a.score).slice(0, LIMIT);
  ranking.forEach((r, i) => lineasTrec.push(
    `${q.qid} Q0 ${docIdDe.get(r.documento_id) ?? r.documento_id} ${i + 1} ${LIMIT - i} ponderado-normalizado`
  ));
}

await fs.mkdir(dirResultados, { recursive: true });
const ruta = path.join(dirResultados, 'ablation-2x2-e5-ponderado-normalizado.trec');
await fs.writeFile(ruta, lineasTrec.join('\n') + (lineasTrec.length ? '\n' : ''));
console.log(`[ponderado-norm] ${lineasTrec.length} líneas → ${ruta}`);

await pool.end();
