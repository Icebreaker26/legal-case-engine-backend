// node eval/scripts/ambiental_05_umbral.js [--dir eval/data/ambiental_v1]
//
// #197 — análisis secundario pre-registrado (descriptivo): umbral de
// similitud sobre los resultados del sistema A (top-10 por consulta) y su
// `similitud` (coseno del mejor trozo). Para cada t en {0.60, …, 0.95}:
//   precisión  = fracción de resultados con similitud ≥ t que tienen grado ≥ 2;
//   cobertura  = fracción de los pares con grado ≥ 2 del top-10 de A que
//                quedan con similitud ≥ t;
//   sin_resultados = fracción de consultas sin ningún resultado ≥ t.
// Solo consultas del split de test. No decide nada: reporta la tabla.
import fs from 'node:fs/promises';
import path from 'node:path';

const argv = Object.fromEntries(
  process.argv.slice(2).reduce((acc, arg, i, arr) => {
    if (arg.startsWith('--')) acc.push([arg.slice(2), arr[i + 1]]);
    return acc;
  }, [])
);
const dir = argv.dir ?? 'eval/data/ambiental_v1';
const UMBRALES = [0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90, 0.95];

const main = async () => {
  const split = JSON.parse(await fs.readFile(path.join(dir, 'split.json'), 'utf8'));
  const test = new Set(split.test);
  const detalle = JSON.parse(await fs.readFile(path.join(dir, 'runs', 'detalle_similitud.json'), 'utf8')).filter((d) => test.has(d.qid));
  const grados = new Map((await fs.readFile(path.join(dir, 'qrels.trec'), 'utf8')).split(/\r?\n/).filter(Boolean).map((l) => {
    const [qid, , doc, g] = l.split(/\s+/);
    return [`${qid}|${doc}`, Number(g)];
  }));

  const resultados = detalle.flatMap((d) => d.A.map((r) => ({ qid: d.qid, similitud: r.similitud, grado: grados.get(`${d.qid}|${r.doc_id}`) ?? 0 })));
  const relevantes = resultados.filter((r) => r.grado >= 2).length;
  const sims = resultados.map((r) => r.similitud).sort((a, b) => a - b);
  const q = (p) => sims[Math.min(sims.length - 1, Math.floor(p * sims.length))];

  const tabla = UMBRALES.map((t) => {
    const sobre = resultados.filter((r) => r.similitud >= t);
    const consultasCon = new Set(sobre.map((r) => r.qid));
    return {
      umbral: t,
      resultados: sobre.length,
      precision_grado2: sobre.length ? sobre.filter((r) => r.grado >= 2).length / sobre.length : null,
      cobertura_grado2: relevantes ? sobre.filter((r) => r.grado >= 2).length / relevantes : null,
      consultas_sin_resultados: 1 - consultasCon.size / detalle.length,
    };
  });

  const salida = {
    descripcion: 'Análisis secundario pre-registrado (#197): umbral de similitud sobre el sistema A (top-10). Descriptivo.',
    consultas: detalle.length,
    resultados: resultados.length,
    resultados_grado2_o_mas: relevantes,
    similitud_cuantiles: { min: sims[0], p25: q(0.25), mediana: q(0.5), p75: q(0.75), max: sims[sims.length - 1] },
    similitud_media_por_grado: Object.fromEntries([0, 1, 2, 3].map((g) => {
      const xs = resultados.filter((r) => r.grado === g).map((r) => r.similitud);
      return [g, xs.length ? Number((xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(4)) : null];
    })),
    tabla,
  };
  await fs.writeFile(path.join(dir, 'umbral_similitud.json'), JSON.stringify(salida, null, 2) + '\n');
  console.log(JSON.stringify(salida, null, 2));
};

await main();
