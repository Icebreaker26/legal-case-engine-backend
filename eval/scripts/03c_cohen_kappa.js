// node eval/scripts/03c_cohen_kappa.js [ruta_csv]
//
// Calcula Cohen's kappa sobre las filas con doble_anotacion=SI del CSV de
// #75 (03b_pool_etiquetado.js), una vez que dos personas llenaron
// relevancia_anotador1_0a3 y relevancia_anotador2_0a3 — NO antes. Si el CSV
// no tiene ninguna fila doblemente anotada todavía, lo dice y no calcula nada
// (no hay "kappa parcial" que valga).
import fs from 'node:fs/promises';

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
  const encabezado = filas[0];
  return filas.slice(1).map(f => Object.fromEntries(encabezado.map((h, i) => [h, f[i]])));
};

const rutaCsv = process.argv[2] ?? 'eval/data/pool_etiquetado_test.csv';
const filas = parsearCsv(await fs.readFile(rutaCsv, 'utf-8'));

const dobles = filas.filter(f => f.doble_anotacion === 'SI');
const completas = dobles.filter(f =>
  f.relevancia_anotador1_0a3?.trim() !== '' && f.relevancia_anotador2_0a3?.trim() !== ''
);

console.log(`[kappa] ${dobles.length} filas marcadas para doble anotación en ${rutaCsv}`);
console.log(`[kappa] ${completas.length} de esas ya tienen ambos anotadores llenos`);

if (completas.length === 0) {
  console.log('[kappa] todavía no hay nada que calcular — llená relevancia_anotador1_0a3 y relevancia_anotador2_0a3 para las filas con doble_anotacion=SI primero.');
  process.exit(0);
}
if (completas.length < dobles.length) {
  console.log(`[kappa] AVISO: faltan ${dobles.length - completas.length} filas doblemente anotadas por completar — el kappa de abajo es parcial, no el final.`);
}

// ── Cohen's kappa estándar (escala 0-3, 4 categorías) ───────────────────────
const a1 = completas.map(f => Number(f.relevancia_anotador1_0a3));
const a2 = completas.map(f => Number(f.relevancia_anotador2_0a3));
const n = completas.length;
const categorias = [0, 1, 2, 3];

const matriz = Object.fromEntries(categorias.map(c => [c, Object.fromEntries(categorias.map(c2 => [c2, 0]))]));
for (let i = 0; i < n; i++) matriz[a1[i]][a2[i]]++;

const po = categorias.reduce((acc, c) => acc + matriz[c][c], 0) / n;

const margen1 = Object.fromEntries(categorias.map(c => [c, categorias.reduce((acc, c2) => acc + matriz[c][c2], 0) / n]));
const margen2 = Object.fromEntries(categorias.map(c => [c, categorias.reduce((acc, c1) => acc + matriz[c1][c], 0) / n]));
const pe = categorias.reduce((acc, c) => acc + margen1[c] * margen2[c], 0);

const kappa = pe === 1 ? 1 : (po - pe) / (1 - pe);

console.log(`\n[kappa] n=${n} pares doblemente anotados`);
console.log(`[kappa] acuerdo observado (po): ${po.toFixed(3)}`);
console.log(`[kappa] acuerdo esperado al azar (pe): ${pe.toFixed(3)}`);
console.log(`[kappa] Cohen's kappa: ${kappa.toFixed(3)}`);
console.log(kappa < 0.2 ? '  → acuerdo pobre' : kappa < 0.4 ? '  → acuerdo débil' : kappa < 0.6 ? '  → acuerdo moderado' : kappa < 0.8 ? '  → acuerdo sustancial' : '  → acuerdo casi perfecto');
