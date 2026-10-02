// node eval/scripts/03d_fusionar_qrels.js [--pool ruta.csv] [--qrels ruta.trec] [--split ruta.json]
//
// Reemplaza, dentro de qrels.trec, las filas de las queries del split de
// test por los grados REALES del pool etiquetado (#75) — las queries de dev
// se quedan con la relevancia mecánica de eval/lib/qrels.js (suficiente para
// tuning/screening, nunca para la confirmación final de #77).
//
// Fuente de verdad por (qid, doc_id): relevancia_anotador1_0a3 (cobertura
// completa, 408/408 pares). relevancia_anotador2_0a3 NO se promedia acá —
// existe solo para medir Cohen's kappa (03c_cohen_kappa.js), no para
// fusionarse en el grado final.
import fs from 'node:fs/promises';

const argv = Object.fromEntries(
  process.argv.slice(2).reduce((acc, arg, i, arr) => {
    if (arg.startsWith('--')) acc.push([arg.slice(2), arr[i + 1]]);
    return acc;
  }, [])
);

const rutaPool = argv.pool ?? 'eval/data/pool_etiquetado_test.csv';
const rutaQrels = argv.qrels ?? 'eval/data/qrels.trec';
const rutaSplit = argv.split ?? 'eval/data/split.json';

const parsearCsv = (texto) => {
  const filas = [];
  let campo = '', fila = [], enComillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (enComillas) {
      if (c === '"') { if (texto[i + 1] === '"') { campo += '"'; i++; } else enComillas = false; }
      else campo += c;
    } else {
      if (c === '"') enComillas = true;
      else if (c === ',') { fila.push(campo); campo = ''; }
      else if (c === '\n') { fila.push(campo); filas.push(fila); fila = []; campo = ''; }
      else if (c === '\r') { /* no-op */ }
      else campo += c;
    }
  }
  if (campo || fila.length) { fila.push(campo); filas.push(fila); }
  const header = filas[0];
  return filas.slice(1).map(f => Object.fromEntries(header.map((h, i) => [h, f[i]])));
};

const pool = parsearCsv(await fs.readFile(rutaPool, 'utf-8'));
const faltantes = pool.filter(f => f.relevancia_anotador1_0a3?.trim() === '' || f.relevancia_anotador1_0a3 === undefined);
if (faltantes.length > 0) {
  console.error(`[fusionar-qrels] ${faltantes.length} pares sin relevancia_anotador1_0a3 todavía — completá el etiquetado antes de fusionar.`);
  process.exit(1);
}

const split = JSON.parse(await fs.readFile(rutaSplit, 'utf-8'));
const testSet = new Set(split.test);

const qrelsActual = (await fs.readFile(rutaQrels, 'utf-8')).trim().split('\n').filter(Boolean);
// Descartar las líneas mecánicas de las queries de test — se reemplazan por completo.
const qrelsSinTest = qrelsActual.filter(l => !testSet.has(l.split(' ')[0]));

const qrelsTestReales = pool
  .filter(f => Number(f.relevancia_anotador1_0a3) > 0)
  .map(f => `${f.qid} 0 ${f.doc_id} ${f.relevancia_anotador1_0a3}`);

const fusionado = [...qrelsSinTest, ...qrelsTestReales].join('\n') + '\n';
await fs.writeFile(rutaQrels, fusionado);

console.log(`[fusionar-qrels] dev (mecánico, sin cambios): ${qrelsSinTest.length} pares`);
console.log(`[fusionar-qrels] test (etiquetado real, #75): ${qrelsTestReales.length} pares de ${pool.length} pooleados (grado 0 excluido)`);
console.log(`[fusionar-qrels] total → ${rutaQrels}`);
