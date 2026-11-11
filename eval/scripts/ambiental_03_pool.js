// node eval/scripts/ambiental_03_pool.js [--dir eval/data/ambiental_v1] [--sesiones 3] [--doble-pct 20] [--seed 42]
//
// #197 — pool ciego para el etiquetado (protocolo de #75/#121, pre-registro
// "Juicios de relevancia"):
//   - pool = unión del top-10 de A y de B por consulta del split de test;
//   - pool_etiquetado.csv: rastro de auditoría con las columnas de sistema
//     (nunca se muestra a los anotadores);
//   - anotacion/anotador1_sesionK.md: el anotador 1 cubre todo el pool,
//     repartido por consultas en K sesiones aisladas;
//   - anotacion/anotador2.md: el 20 % de las consultas (al azar, semilla
//     fija), para Cohen's kappa.
// Cada paquete lista los pares ordenados por id de documento (no por ranking)
// y no dice qué sistema recuperó cada uno. No toca la base de datos.
import fs from 'node:fs/promises';
import path from 'node:path';

const argv = Object.fromEntries(
  process.argv.slice(2).reduce((acc, arg, i, arr) => {
    if (arg.startsWith('--')) acc.push([arg.slice(2), arr[i + 1]]);
    return acc;
  }, [])
);
const dir = argv.dir ?? 'eval/data/ambiental_v1';
const nSesiones = Number(argv.sesiones ?? 3);
const doblePct = Number(argv['doble-pct'] ?? 20);
const seed = Number(argv.seed ?? 42);
const PROFUNDIDAD = 10;

const leerJsonl = async (ruta) => (await fs.readFile(ruta, 'utf8')).split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l));
const leerTrec = async (ruta) => {
  const porQid = new Map();
  for (const linea of (await fs.readFile(ruta, 'utf8')).split(/\r?\n/).filter(Boolean)) {
    const [qid, , doc, rank] = linea.split(/\s+/);
    if (Number(rank) > PROFUNDIDAD) continue;
    if (!porQid.has(qid)) porQid.set(qid, []);
    porQid.get(qid).push(doc);
  }
  return porQid;
};

// mulberry32: generador determinista para elegir la doble anotación.
const generador = (s) => () => {
  s |= 0; s = (s + 0x6D2B79F5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const csv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const recorte = (t, n) => (t.length > n ? `${t.slice(0, n).trimEnd()} […]` : t);

const ficha = (e, nContenido) => [
  `- **Título:** ${e.titulo}`,
  `- **Tipo de instrumento:** ${e.tipo_instrumento}`,
  `- **Qué ordena:** ${e.que_ordena}`,
  e.resumen ? `- **Resumen del análisis:** ${e.resumen}` : '- **Resumen del análisis:** (sin análisis)',
  `- **Texto (inicio):**\n\n${recorte(e.contenido_texto, nContenido).split('\n').map((l) => `  > ${l}`).join('\n')}`,
].join('\n');

const INSTRUCCIONES = (archivoSalida) => `# Etiquetado de relevancia — expedientes ambientales

Eres un abogado ambiental en Colombia. Para cada **expediente consulta** debes juzgar qué tan útil es cada **expediente candidato** como precedente para atenderlo. Juzga cada par por separado, solo con el contenido de los expedientes.

Escala (entero de 0 a 3):
- **3** = misma obligación o situación, directamente aplicable como precedente.
- **2** = mismo tema con diferencias relevantes, útil como referencia.
- **1** = relación tangencial.
- **0** = no relacionado.

Escribe el resultado en \`${archivoSalida}\`: un CSV en UTF-8 con encabezado exacto \`qid,doc_id,relevancia_0a3,razon_breve\` y **una fila por cada par listado abajo** (ni más ni menos). La razón breve va entre comillas dobles, en español y con máximo 20 palabras. No leas ningún otro archivo. Al terminar, responde solo cuántas filas escribiste.
`;

const main = async () => {
  const corpus = new Map((await leerJsonl(path.join(dir, 'corpus.jsonl'))).map((e) => [e.id, e]));
  const consultas = new Map((await leerJsonl(path.join(dir, 'consultas.jsonl'))).map((e) => [e.qid, e]));
  const split = JSON.parse(await fs.readFile(path.join(dir, 'split.json'), 'utf8'));
  const runs = { 'A-alpha-e5': await leerTrec(path.join(dir, 'runs', 'A-alpha-e5.trec')), 'B-rrf-e5': await leerTrec(path.join(dir, 'runs', 'B-rrf-e5.trec')) };

  const qids = [...split.test].sort();
  const azar = generador(seed);
  const nDoble = Math.round((qids.length * doblePct) / 100);
  const barajadas = qids.map((q) => [azar(), q]).sort((a, b) => a[0] - b[0]).map(([, q]) => q);
  const doble = new Set(barajadas.slice(0, nDoble));

  const pares = [];
  for (const qid of qids) {
    const docs = new Map();
    for (const [nombre, run] of Object.entries(runs)) for (const d of run.get(qid) ?? []) docs.set(d, [...(docs.get(d) ?? []), nombre]);
    for (const d of [...docs.keys()].sort()) pares.push({ qid, doc_id: d, sistemas: docs.get(d), doble: doble.has(qid) });
  }

  const filas = [['qid', 'doc_id', 'doc_titulo', 'n_sistemas_que_lo_recuperaron', 'sistemas', 'doble_anotacion', 'relevancia_anotador1_0a3', 'relevancia_anotador2_0a3', 'notas'].join(',')];
  for (const p of pares) filas.push([p.qid, p.doc_id, corpus.get(p.doc_id).titulo, p.sistemas.length, p.sistemas.join('|'), p.doble ? 'SI' : 'NO', '', '', ''].map(csv).join(','));
  await fs.writeFile(path.join(dir, 'pool_etiquetado.csv'), filas.join('\n') + '\n');

  const dirAnot = path.join(dir, 'anotacion');
  await fs.mkdir(dirAnot, { recursive: true });
  const paquete = async (nombre, qidsPaquete) => {
    const paresP = pares.filter((p) => qidsPaquete.includes(p.qid));
    const docsP = [...new Set(paresP.map((p) => p.doc_id))].sort();
    const salida = path.join(dirAnot, `${nombre}_resultado.csv`).replace(/\\/g, '/');
    const partes = [INSTRUCCIONES(path.resolve(salida)), `\nPares a juzgar: **${paresP.length}** (${qidsPaquete.length} consultas, ${docsP.length} candidatos distintos).\n`];
    partes.push('\n## Expedientes candidatos\n');
    for (const d of docsP) partes.push(`\n### ${d}\n\n${ficha(corpus.get(d), 1500)}\n`);
    partes.push('\n## Expedientes consulta y pares\n');
    for (const q of qidsPaquete) {
      partes.push(`\n### ${q}\n\n${ficha(consultas.get(q), 2500)}\n\nCandidatos a juzgar para ${q}: ${paresP.filter((p) => p.qid === q).map((p) => p.doc_id).join(', ')}\n`);
    }
    await fs.writeFile(path.join(dirAnot, `${nombre}.md`), partes.join(''));
    return { nombre, consultas: qidsPaquete.length, pares: paresP.length };
  };

  const resumen = [];
  const tam = Math.ceil(qids.length / nSesiones);
  for (let k = 0; k < nSesiones; k++) resumen.push(await paquete(`anotador1_sesion${k + 1}`, qids.slice(k * tam, (k + 1) * tam)));
  resumen.push(await paquete('anotador2', [...doble].sort()));

  console.log(JSON.stringify({ consultas: qids.length, pares: pares.length, doble_anotacion: [...doble].sort(), paquetes: resumen }, null, 2));
};

await main();
