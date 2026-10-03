// Cálculo informal de recall@5 y nDCG@5 — solo para comprobar que el
// arnés funciona de punta a punta durante la Fase 3. El cálculo formal
// con ranx (citable, validado) es el alcance de #76, no de este script.
//
// Uso: node eval/scripts/_sanity_metrics.mjs eval/results/runs/E01-baseline-ponderado.trec eval/fixtures/mini/qrels.trec
import fs from 'node:fs/promises';

const K = 5;

const leerTrec = async (ruta) => {
  const lineas = (await fs.readFile(ruta, 'utf-8')).trim().split('\n').filter(Boolean);
  const porQuery = new Map();
  for (const l of lineas) {
    const [qid, , docId, rank] = l.split(' ');
    if (!porQuery.has(qid)) porQuery.set(qid, []);
    porQuery.get(qid)[Number(rank) - 1] = docId;
  }
  return porQuery;
};

const leerQrels = async (ruta) => {
  const lineas = (await fs.readFile(ruta, 'utf-8')).trim().split('\n').filter(Boolean);
  const porQuery = new Map();
  for (const l of lineas) {
    const [qid, , docId, grado] = l.split(' ');
    if (!porQuery.has(qid)) porQuery.set(qid, new Map());
    porQuery.get(qid).set(docId, Number(grado));
  }
  return porQuery;
};

const [rutaRun, rutaQrels] = process.argv.slice(2);
const run = await leerTrec(rutaRun);
const qrels = await leerQrels(rutaQrels);

// Un run con el mismo documento repetido en el top-K de una consulta infla el
// recall y el nDCG contando el mismo acierto más de una vez (#104) — el
// generador del run debe deduplicar por documento (como hace producción con
// ROW_NUMBER PARTITION BY documento_id), no este script. Si aparece, se
// rechaza el run entero en vez de calcular métricas sobre un número inflado.
let duplicadosEncontrados = false;
for (const [qid, ranking] of run) {
  const vistos = new Set();
  for (const docId of ranking.slice(0, K)) {
    if (vistos.has(docId)) {
      console.error(`[sanity] RECHAZADO: ${qid} tiene "${docId}" repetido en el top-${K} de ${rutaRun} — dedupea por documento en el generador del run antes de medir.`);
      duplicadosEncontrados = true;
    }
    vistos.add(docId);
  }
}
if (duplicadosEncontrados) process.exit(1);

let sumaRecall = 0, sumaNdcg = 0, n = 0;

for (const [qid, relevantes] of qrels) {
  const ranking = (run.get(qid) ?? []).slice(0, K);
  const relevantesTotal = [...relevantes.values()].filter(g => g > 0).length;

  const recuperados = ranking.filter(d => (relevantes.get(d) ?? 0) > 0).length;
  const recall = relevantesTotal ? recuperados / relevantesTotal : null;

  const dcg = ranking.reduce((acc, d, i) => acc + (relevantes.get(d) ?? 0) / Math.log2(i + 2), 0);
  const idealGrados = [...relevantes.values()].sort((a, b) => b - a).slice(0, K);
  const idcg = idealGrados.reduce((acc, g, i) => acc + g / Math.log2(i + 2), 0);
  const ndcg = idcg ? dcg / idcg : null;

  console.log(`${qid}: recall@${K}=${recall?.toFixed(3) ?? 'n/a'} nDCG@${K}=${ndcg?.toFixed(3) ?? 'n/a'}  top${K}=[${ranking.join(', ')}]`);
  if (recall !== null) { sumaRecall += recall; n++; }
  if (ndcg !== null) sumaNdcg += ndcg;
}

console.log(`\nPromedio recall@${K}: ${(sumaRecall / n).toFixed(3)}   Promedio nDCG@${K}: ${(sumaNdcg / n).toFixed(3)}  (${n} queries con al menos 1 relevante)`);
