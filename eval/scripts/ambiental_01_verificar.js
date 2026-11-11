// node eval/scripts/ambiental_01_verificar.js [--dir eval/data/ambiental_v1]
//
// #197 — verificación independiente del corpus ambiental generado por los
// subagentes (no el autorreporte del generador), según el pre-registro:
//   1. une los lotes (lotes/loteN_corpus.jsonl, lotes/loteN_consultas.jsonl)
//      en corpus.jsonl y consultas.jsonl;
//   2. contrato Zod (eval/schemaAmbiental.js), ids y numero_expediente únicos;
//   3. composición: 5 expedientes de corpus por tema, 30 consultas (4/3/3 por
//      lote), subtema de cada consulta presente en el corpus de su tema;
//   4. sin PII (correo, teléfono, cédula/NIT explícitos);
//   5. duplicados por contenido: Jaccard de 5-gramas de palabras ≥ 0.8
//      (consulta–consulta → se descarta la de qid mayor; consulta–corpus →
//      se descarta la consulta; corpus–corpus → solo se reporta).
// Escribe verificacion.json y split.json (consultas de test = todas menos
// las descartadas). No toca ninguna base de datos.
import fs from 'node:fs/promises';
import path from 'node:path';
import { ExpedienteSchema, ConsultaSchema, TEMAS_AMBIENTAL } from '../schemaAmbiental.js';

const argv = Object.fromEntries(
  process.argv.slice(2).reduce((acc, arg, i, arr) => {
    if (arg.startsWith('--')) acc.push([arg.slice(2), arr[i + 1]]);
    return acc;
  }, [])
);
const dir = argv.dir ?? 'eval/data/ambiental_v1';
const UMBRAL_DUPLICADO = 0.8;

const leerJsonl = async (ruta) => {
  const texto = await fs.readFile(ruta, 'utf8');
  return texto.split(/\r?\n/).filter((l) => l.trim()).map((l, i) => {
    try { return JSON.parse(l); } catch (e) { throw new Error(`${ruta}:${i + 1}: JSON inválido (${e.message})`); }
  });
};

const shingles = (texto, n = 5) => {
  const palabras = texto.toLowerCase().normalize('NFC').match(/\p{L}+|\d+/gu) ?? [];
  const s = new Set();
  for (let i = 0; i + n <= palabras.length; i++) s.add(palabras.slice(i, i + n).join(' '));
  return s;
};
const jaccard = (a, b) => {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter || 1);
};

const PII = [
  ['correo', /[\w.+-]+@[\w-]+\.[\w.]+/],
  ['celular', /\b3\d{2}[\s-]?\d{3}[\s-]?\d{4}\b/],
  ['cedula_o_nit', /\b(c\.?\s?c\.?|c[ée]dula|nit)\s*(n[o°º.]*\s*)?[:#]?\s*\d[\d.\s-]{5,}/i],
];

const main = async () => {
  const errores = [];
  const corpus = [];
  const consultas = [];
  for (const n of [1, 2, 3]) {
    corpus.push(...await leerJsonl(path.join(dir, 'lotes', `lote${n}_corpus.jsonl`)));
    consultas.push(...await leerJsonl(path.join(dir, 'lotes', `lote${n}_consultas.jsonl`)));
  }

  // 2. Contrato y unicidad
  corpus.forEach((e) => { const r = ExpedienteSchema.safeParse(e); if (!r.success) errores.push(`corpus ${e.id}: ${r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`); });
  consultas.forEach((e) => { const r = ConsultaSchema.safeParse(e); if (!r.success) errores.push(`consulta ${e.qid}: ${r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`); });
  const repetidos = (xs) => xs.filter((x, i) => xs.indexOf(x) !== i);
  const idsRep = repetidos([...corpus.map((e) => e.id), ...consultas.map((e) => e.qid)]);
  const numRep = repetidos([...corpus, ...consultas].map((e) => e.numero_expediente));
  if (idsRep.length) errores.push(`ids repetidos: ${idsRep.join(', ')}`);
  if (numRep.length) errores.push(`numero_expediente repetidos: ${numRep.join(', ')}`);

  // 3. Composición
  const porTema = Object.fromEntries(TEMAS_AMBIENTAL.map((t) => [t, { corpus: 0, consultas: 0, subtemas: new Set() }]));
  corpus.forEach((e) => { const t = porTema[e.spec?.tema]; if (t) { t.corpus++; t.subtemas.add(e.spec.subtema); } });
  consultas.forEach((e) => {
    const t = porTema[e.spec?.tema];
    if (!t) return;
    t.consultas++;
    if (!t.subtemas.has(e.spec.subtema)) errores.push(`consulta ${e.qid}: subtema "${e.spec.subtema}" no existe en el corpus de ${e.spec.tema}`);
  });
  for (const [tema, t] of Object.entries(porTema)) if (t.corpus !== 5) errores.push(`tema ${tema}: ${t.corpus} expedientes de corpus (se esperaban 5)`);
  if (corpus.length !== 45) errores.push(`corpus: ${corpus.length} expedientes (se esperaban 45)`);
  if (consultas.length !== 30) errores.push(`consultas: ${consultas.length} (se esperaban 30)`);

  // 4. PII
  for (const e of [...corpus, ...consultas]) {
    const texto = [e.titulo, e.contenido_texto, e.que_ordena, e.resumen].filter(Boolean).join('\n');
    for (const [nombre, re] of PII) if (re.test(texto)) errores.push(`${e.id ?? e.qid}: posible PII (${nombre}): "${texto.match(re)[0]}"`);
  }

  // 5. Duplicados por contenido
  const sh = new Map([...corpus.map((e) => [e.id, shingles(e.contenido_texto)]), ...consultas.map((e) => [e.qid, shingles(e.contenido_texto)])]);
  const pares = [];
  const descartadas = new Map();
  const qids = consultas.map((c) => c.qid).sort();
  for (let i = 0; i < qids.length; i++) {
    for (let j = i + 1; j < qids.length; j++) {
      const s = jaccard(sh.get(qids[i]), sh.get(qids[j]));
      if (s >= UMBRAL_DUPLICADO) { pares.push({ tipo: 'consulta-consulta', a: qids[i], b: qids[j], jaccard: s }); descartadas.set(qids[j], `duplicado de ${qids[i]} (Jaccard ${s.toFixed(3)})`); }
    }
    for (const e of corpus) {
      const s = jaccard(sh.get(qids[i]), sh.get(e.id));
      if (s >= UMBRAL_DUPLICADO) { pares.push({ tipo: 'consulta-corpus', a: qids[i], b: e.id, jaccard: s }); descartadas.set(qids[i], `duplicado de ${e.id} (Jaccard ${s.toFixed(3)})`); }
    }
  }
  for (let i = 0; i < corpus.length; i++) for (let j = i + 1; j < corpus.length; j++) {
    const s = jaccard(sh.get(corpus[i].id), sh.get(corpus[j].id));
    if (s >= UMBRAL_DUPLICADO) pares.push({ tipo: 'corpus-corpus (solo reporte)', a: corpus[i].id, b: corpus[j].id, jaccard: s });
  }
  // Máximo Jaccard observado por tipo, para dejar constancia aunque nada cruce el umbral.
  const maximo = (tipo, xs) => xs.reduce((m, x) => (x.s > m.s ? x : m), { s: 0, tipo });
  const todosQQ = []; const todosQC = []; const todosCC = [];
  for (let i = 0; i < qids.length; i++) {
    for (let j = i + 1; j < qids.length; j++) todosQQ.push({ a: qids[i], b: qids[j], s: jaccard(sh.get(qids[i]), sh.get(qids[j])) });
    for (const e of corpus) todosQC.push({ a: qids[i], b: e.id, s: jaccard(sh.get(qids[i]), sh.get(e.id)) });
  }
  for (let i = 0; i < corpus.length; i++) for (let j = i + 1; j < corpus.length; j++) todosCC.push({ a: corpus[i].id, b: corpus[j].id, s: jaccard(sh.get(corpus[i].id), sh.get(corpus[j].id)) });

  const conAnalisis = (xs) => xs.filter((e) => e.resumen !== null).length;
  const longitudes = (xs) => { const l = xs.map((e) => e.contenido_texto.length).sort((a, b) => a - b); return { min: l[0], mediana: l[Math.floor(l.length / 2)], max: l[l.length - 1] }; };

  const reporte = {
    fecha: new Date().toISOString(),
    corpus: corpus.length,
    consultas: consultas.length,
    corpus_con_analisis: conAnalisis(corpus),
    consultas_con_analisis: conAnalisis(consultas),
    longitud_contenido_corpus: longitudes(corpus),
    longitud_contenido_consultas: longitudes(consultas),
    composicion: Object.fromEntries(Object.entries(porTema).map(([t, v]) => [t, { corpus: v.corpus, consultas: v.consultas, subtemas: [...v.subtemas].sort() }])),
    umbral_duplicado_jaccard_5gramas: UMBRAL_DUPLICADO,
    jaccard_maximo: {
      consulta_consulta: maximo('consulta-consulta', todosQQ),
      consulta_corpus: maximo('consulta-corpus', todosQC),
      corpus_corpus: maximo('corpus-corpus', todosCC),
    },
    pares_sobre_umbral: pares,
    consultas_descartadas: Object.fromEntries(descartadas),
    errores,
  };

  await fs.writeFile(path.join(dir, 'corpus.jsonl'), corpus.map((e) => JSON.stringify(e)).join('\n') + '\n');
  await fs.writeFile(path.join(dir, 'consultas.jsonl'), consultas.map((e) => JSON.stringify(e)).join('\n') + '\n');
  await fs.writeFile(path.join(dir, 'verificacion.json'), JSON.stringify(reporte, null, 2) + '\n');
  if (!errores.length) {
    const test = qids.filter((q) => !descartadas.has(q));
    await fs.writeFile(path.join(dir, 'split.json'), JSON.stringify({
      descripcion: 'Banco ambiental v1 (#197): todas las consultas válidas van a test; no hay dev (la configuración está congelada).',
      dev: [],
      test,
      descartadas_por_duplicado: Object.fromEntries(descartadas),
    }, null, 2) + '\n');
  }

  console.log(JSON.stringify({ ...reporte, composicion: undefined, pares_sobre_umbral: pares.length }, null, 2));
  console.log(errores.length ? `\n[verificar] ${errores.length} errores — no se escribe split.json` : '\n[verificar] OK');
  process.exitCode = errores.length ? 1 : 0;
};

await main();
