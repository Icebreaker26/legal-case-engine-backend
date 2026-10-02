// node eval/scripts/03_generar_qrels.js --corpus eval/data/corpus.jsonl --queries eval/data/queries.jsonl --out eval/data/qrels.trec
//
// No requiere guard.js ni DATABASE_URL — es una función pura sobre los
// archivos de corpus/queries (deriva relevancia de su `spec`, nunca de
// una consulta a la base de datos).
import fs from 'node:fs';
import { DocSchema, QuerySchema, cargarYValidar } from '../schema.js';
import { construirQrelsTrec } from '../lib/qrels.js';

const argv = Object.fromEntries(
  process.argv.slice(2).reduce((acc, arg, i, arr) => {
    if (arg.startsWith('--')) acc.push([arg.slice(2), arr[i + 1]]);
    return acc;
  }, [])
);

const rutaCorpus = argv.corpus ?? 'eval/fixtures/mini/corpus.jsonl';
const rutaQueries = argv.queries ?? 'eval/fixtures/mini/queries.jsonl';
const rutaOut = argv.out ?? 'eval/fixtures/mini/qrels.trec';

const corpus = await cargarYValidar(rutaCorpus, DocSchema);
const queries = await cargarYValidar(rutaQueries, QuerySchema);
const trec = construirQrelsTrec(queries, corpus);
fs.writeFileSync(rutaOut, trec);

const lineas = trec.trim().split('\n').filter(Boolean);
const qidsConQrel = new Set(lineas.map(l => l.split(' ')[0]));
const sinQrel = queries.filter(q => !qidsConQrel.has(q.qid));

console.log(`[qrels] ${lineas.length} pares relevantes → ${rutaOut}`);
console.log(`[qrels] grado 2: ${lineas.filter(l => l.endsWith(' 2')).length}, grado 1: ${lineas.filter(l => l.endsWith(' 1')).length}`);
if (sinQrel.length) {
  console.warn(`[qrels] ADVERTENCIA — queries sin ningún relevante: ${sinQrel.map(q => q.qid).join(', ')}`);
}
