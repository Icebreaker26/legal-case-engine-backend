// node eval/scripts/ambiental_04_qrels.js [--dir eval/data/ambiental_v1]
//
// #197 — une los juicios de las sesiones de anotación en el pool y genera
// qrels.trec (pre-registro, "Juicios de relevancia"):
//   - verdad de referencia = grado del anotador 1 (igual que v3,
//     03d_fusionar_qrels.js); el anotador 2 solo llena su columna del pool,
//     para Cohen's kappa (03c_cohen_kappa.js);
//   - exige cobertura exacta: cada par del pool con un grado 0-3 del
//     anotador 1, y cada par doblemente anotado con uno del anotador 2.
import fs from 'node:fs/promises';
import path from 'node:path';

const argv = Object.fromEntries(
  process.argv.slice(2).reduce((acc, arg, i, arr) => {
    if (arg.startsWith('--')) acc.push([arg.slice(2), arr[i + 1]]);
    return acc;
  }, [])
);
const dir = argv.dir ?? 'eval/data/ambiental_v1';

const parsearCsv = (texto) => {
  const filas = [];
  let campo = '', fila = [], enComillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (enComillas) {
      if (c === '"') { if (texto[i + 1] === '"') { campo += '"'; i++; } else enComillas = false; } else campo += c;
    } else if (c === '"') enComillas = true;
    else if (c === ',') { fila.push(campo); campo = ''; }
    else if (c === '\n') { fila.push(campo); filas.push(fila); fila = []; campo = ''; }
    else if (c !== '\r') campo += c;
  }
  if (campo || fila.length) { fila.push(campo); filas.push(fila); }
  const encabezado = filas[0].map((h) => h.replace(/^﻿/, '').trim());
  return filas.slice(1).filter((f) => f.some((x) => x.trim())).map((f) => Object.fromEntries(encabezado.map((h, i) => [h, (f[i] ?? '').trim()])));
};
const csv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

const leerAnotaciones = async (archivos) => {
  const grados = new Map();
  const errores = [];
  for (const a of archivos) {
    for (const f of parsearCsv(await fs.readFile(a, 'utf8'))) {
      const clave = `${f.qid}|${f.doc_id}`;
      const g = Number(f.relevancia_0a3);
      if (!Number.isInteger(g) || g < 0 || g > 3) errores.push(`${path.basename(a)}: ${clave} grado inválido "${f.relevancia_0a3}"`);
      if (grados.has(clave)) errores.push(`${path.basename(a)}: ${clave} repetido`);
      grados.set(clave, { grado: g, razon: f.razon_breve });
    }
  }
  return { grados, errores };
};

const main = async () => {
  const dirAnot = path.join(dir, 'anotacion');
  const archivos = (await fs.readdir(dirAnot));
  const a1 = await leerAnotaciones(archivos.filter((f) => /^anotador1_sesion\d+_resultado\.csv$/.test(f)).sort().map((f) => path.join(dirAnot, f)));
  const a2 = await leerAnotaciones(archivos.filter((f) => f === 'anotador2_resultado.csv').map((f) => path.join(dirAnot, f)));

  const rutaPool = path.join(dir, 'pool_etiquetado.csv');
  const pool = parsearCsv(await fs.readFile(rutaPool, 'utf8'));
  const errores = [...a1.errores, ...a2.errores];
  const clavesPool = new Set(pool.map((p) => `${p.qid}|${p.doc_id}`));
  for (const p of pool) {
    const clave = `${p.qid}|${p.doc_id}`;
    if (!a1.grados.has(clave)) errores.push(`anotador 1 no juzgó ${clave}`);
    if (p.doble_anotacion === 'SI' && !a2.grados.has(clave)) errores.push(`anotador 2 no juzgó ${clave}`);
    p.relevancia_anotador1_0a3 = a1.grados.get(clave)?.grado ?? '';
    p.relevancia_anotador2_0a3 = p.doble_anotacion === 'SI' ? (a2.grados.get(clave)?.grado ?? '') : '';
    p.notas = a1.grados.get(clave)?.razon ?? '';
  }
  for (const clave of [...a1.grados.keys(), ...a2.grados.keys()]) if (!clavesPool.has(clave)) errores.push(`par fuera del pool: ${clave}`);

  if (errores.length) {
    console.error(`[qrels] ${errores.length} errores:\n${errores.slice(0, 40).join('\n')}`);
    process.exitCode = 1;
    return;
  }

  const columnas = Object.keys(pool[0]);
  await fs.writeFile(rutaPool, [columnas.join(','), ...pool.map((p) => columnas.map((c) => csv(p[c])).join(','))].join('\n') + '\n');
  const qrels = pool.map((p) => `${p.qid} 0 ${p.doc_id} ${p.relevancia_anotador1_0a3}`).sort();
  await fs.writeFile(path.join(dir, 'qrels.trec'), qrels.join('\n') + '\n');

  const dist = [0, 1, 2, 3].map((g) => pool.filter((p) => Number(p.relevancia_anotador1_0a3) === g).length);
  console.log(`[qrels] ${pool.length} pares — grados 0/1/2/3: ${dist.join('/')} — anotador 2: ${pool.filter((p) => p.doble_anotacion === 'SI').length} pares`);
};

await main();
