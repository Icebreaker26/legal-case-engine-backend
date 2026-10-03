// node eval/scripts/03b_pool_etiquetado.js [--out ruta.csv] [--qids ruta.json] [--runs run1.trec,run2.trec,...] [--doble-pct 20]
//
// Pooling al estilo TREC para #75: une el top-10 de CADA sistema candidato
// (no solo el actual) para cada consulta, y arma un CSV listo para que una
// persona con criterio jurídico asigne relevancia 0-3 — el etiquetado en sí
// NO lo hace este script ni ningún agente. Ver eval/data/README.md y el
// issue #75: "dado que no hay abogados reales disponibles para datos
// sintéticos, el etiquetado puede hacerlo el autor de la tesis".
//
// No requiere conexión a rag-eval-db — solo lee los .trec ya generados
// (corridos por separado con 02_indexar.js + 04_correr.js/00_ablation.js/
// 00_ponderado_normalizado.js para cada sistema candidato) y los jsonl del
// corpus/consultas.
import fs from 'node:fs/promises';
import path from 'node:path';
import { DocSchema, QuerySchema, cargarYValidar } from '../schema.js';

const argv = Object.fromEntries(
  process.argv.slice(2).reduce((acc, arg, i, arr) => {
    if (arg.startsWith('--')) acc.push([arg.slice(2), arr[i + 1]]);
    return acc;
  }, [])
);

const rutaCorpus = argv.corpus ?? 'eval/data/corpus.jsonl';
const rutaQueries = argv.queries ?? 'eval/data/queries.jsonl';
const rutaSplit = argv.split ?? 'eval/data/split.json';
const rutaOut = argv.out ?? 'eval/data/pool_etiquetado.csv';
const doblePct = Number(argv['doble-pct'] ?? 20);
const PROFUNDIDAD = 10;

// Sistemas candidatos por defecto — el pool congelado de #75 (#77 + diversidad de #98).
// Pasar --runs para poolear un subconjunto distinto, pero congelar la lista
// ANTES de anotar (no se agregan sistemas a mitad de etiquetado).
const rutasRuns = (argv.runs
  ? argv.runs.split(',')
  : [
      'eval/data/runs/pool-e5-ponderado.trec',          // H1: candidato principal de #77
      'eval/data/runs/pool-e5-rrf.trec',                 // H2: alternativa de fusión
      'eval/data/runs/pool-minilm-ponderado.trec',       // línea base de producción (H1, referencia)
      'eval/data/runs/pool-lexico-solo.trec',            // control (#77) — ya le ganó a la fusión en nDCG en #95
      'eval/data/runs/pool-e5-vector-solo.trec',         // diversidad (#98)
      'eval/data/runs/pool-e5-ponderado-normalizado.trec', // diversidad (#98)
    ]
);

const leerTrecTop10 = async (ruta) => {
  const nombreSistema = path.basename(ruta, '.trec');
  const lineas = (await fs.readFile(ruta, 'utf-8')).trim().split('\n').filter(Boolean);
  const porQuery = new Map();
  for (const l of lineas) {
    const [qid, , docId, rank] = l.split(' ');
    if (Number(rank) > PROFUNDIDAD) continue;
    if (!porQuery.has(qid)) porQuery.set(qid, []);
    porQuery.get(qid).push(docId);
  }
  return { nombreSistema, porQuery };
};

const corpus = await cargarYValidar(rutaCorpus, DocSchema);
const queries = await cargarYValidar(rutaQueries, QuerySchema);
const docPorId = new Map(corpus.map(d => [d.id, d]));
const queryPorQid = new Map(queries.map(q => [q.qid, q]));

const split = JSON.parse(await fs.readFile(rutaSplit, 'utf-8'));
const qidsAPoolear = argv.qids
  ? JSON.parse(await fs.readFile(argv.qids, 'utf-8'))
  : split.test; // default: solo el split de test congelado — ver #75/#77

const runs = await Promise.all(rutasRuns.map(leerTrecTop10));
console.log(`[pool] ${runs.length} sistemas: ${runs.map(r => r.nombreSistema).join(', ')}`);
console.log(`[pool] poolando ${qidsAPoolear.length} consultas (${argv.qids ? argv.qids : 'split.test'})`);

// ── Unir top-10 de todos los sistemas por query ─────────────────────────────
const filas = [];
for (const qid of qidsAPoolear) {
  const q = queryPorQid.get(qid);
  if (!q) { console.warn(`[pool] AVISO: ${qid} no está en ${rutaQueries}, se omite`); continue; }

  const docIdsPorSistema = new Map(); // docId -> [nombreSistema, ...]
  for (const { nombreSistema, porQuery } of runs) {
    for (const docId of (porQuery.get(qid) ?? [])) {
      if (!docIdsPorSistema.has(docId)) docIdsPorSistema.set(docId, []);
      docIdsPorSistema.get(docId).push(nombreSistema);
    }
  }

  for (const [docId, sistemas] of docIdsPorSistema) {
    const doc = docPorId.get(docId);
    filas.push({
      qid,
      query_texto: q.texto,
      doc_id: docId,
      doc_titulo: doc?.titulo ?? '(doc no encontrado en corpus)',
      doc_snippet: (doc?.texto ?? '').slice(0, 400).replace(/\n/g, ' '),
      n_sistemas: sistemas.length,
      sistemas: sistemas.join('|'),
    });
  }
}

// ── Marcar ~doblePct% de las CONSULTAS (no de los pares) para doble anotación ──
// Determinista: cada ceil(100/doblePct)-ésima query del split, no al azar —
// reproducible si hay que regenerar el CSV.
const stride = Math.round(100 / doblePct);
const qidsDoble = new Set(qidsAPoolear.filter((_, i) => i % stride === 0));
console.log(`[pool] doble anotación: ${qidsDoble.size}/${qidsAPoolear.length} consultas (${(100 * qidsDoble.size / qidsAPoolear.length).toFixed(0)}%)`);

// ── CSV ──────────────────────────────────────────────────────────────────
const csvEscape = (v) => `"${String(v).replace(/"/g, '""')}"`;
const encabezado = [
  'qid', 'query_texto', 'doc_id', 'doc_titulo', 'doc_snippet',
  'n_sistemas_que_lo_recuperaron', 'sistemas',
  'doble_anotacion', 'relevancia_anotador1_0a3', 'relevancia_anotador2_0a3', 'notas',
];
const lineasCsv = [encabezado.join(',')];
for (const f of filas) {
  lineasCsv.push([
    csvEscape(f.qid),
    csvEscape(f.query_texto),
    csvEscape(f.doc_id),
    csvEscape(f.doc_titulo),
    csvEscape(f.doc_snippet),
    f.n_sistemas,
    csvEscape(f.sistemas),
    qidsDoble.has(f.qid) ? 'SI' : '',
    '', // relevancia_anotador1_0a3 — a llenar
    qidsDoble.has(f.qid) ? '' : 'n/a', // relevancia_anotador2_0a3 — solo si doble_anotacion=SI
    '', // notas
  ].join(','));
}

await fs.writeFile(rutaOut, lineasCsv.join('\n') + '\n');
console.log(`[pool] ${filas.length} pares (query, documento) → ${rutaOut}`);
console.log(`[pool] promedio de documentos únicos por consulta: ${(filas.length / qidsAPoolear.length).toFixed(1)}`);
