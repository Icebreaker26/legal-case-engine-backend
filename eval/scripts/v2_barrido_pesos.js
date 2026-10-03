// node --env-file=eval/.env.eval.v2[.e5] --import ./eval/guard.js eval/scripts/v2_barrido_pesos.js --corpus eval/data/v2/corpus_v2.jsonl --queries eval/data/v2/queries_v2.jsonl --out eval/data/v2/runs --modelo minilm [--alphas 0.9]
//
// #115 (Fase D) — pre-registrado en eval/data/v2/preregistro_barrido_pesos.md
// ANTES de correr esto. Barrido de alpha (peso vectorial) de 0.0 a 1.0 en
// pasos de 0.1 (o un subconjunto con --alphas, p.ej. para congelar una sola
// configuracion y confirmarla sobre el test YA ETIQUETADO de v1 -- ver la
// regla de parada del pre-registro), mismo patron de dedup por documento
// (ROW_NUMBER, recalculado POR CADA alpha porque el mejor chunk de un
// documento puede cambiar segun el peso) que usa 00_ablation.js/produccion.
// Generico: --corpus/--queries no estan atados a v2, se reusa tal cual para
// la confirmatoria sobre el corpus v1. El termino de feedback
// (relevancia_score) se deja fuera -- siempre 0 en el corpus sintetico, no
// afecta el orden con ningun peso.
import fs from 'node:fs/promises';
import path from 'node:path';
import pool from '../../src/db/database.js';
import { limpiarTexto } from '../../src/modules/tutelas/services/cleanerService.js';
import { generarEmbeddingLocal } from '../../src/modules/tutelas/services/aiService.js';
import { DocSchema, QuerySchema, cargarYValidar } from '../schema.js';
import { uuidDeDoc } from '../config.js';

const argv = Object.fromEntries(
  process.argv.slice(2).reduce((acc, arg, i, arr) => {
    if (arg.startsWith('--')) acc.push([arg.slice(2), arr[i + 1]]);
    return acc;
  }, [])
);

const rutaCorpus = argv.corpus ?? 'eval/data/v2/corpus_v2.jsonl';
const rutaQueries = argv.queries ?? 'eval/data/v2/queries_v2.jsonl';
const dirResultados = argv.out ?? 'eval/data/v2/runs';
const modeloLabel = argv.modelo ?? 'modelo';
const LIMIT = 10;
const ALPHAS = argv.alphas
  ? argv.alphas.split(',').map(Number)
  : Array.from({ length: 11 }, (_, i) => Math.round(i * 10) / 100 * 10 / 10); // 0.0..1.0

const corpus = await cargarYValidar(rutaCorpus, DocSchema);
const queries = (await cargarYValidar(rutaQueries, QuerySchema)).sort((a, b) => a.qid.localeCompare(b.qid));
const docIdDe = new Map(corpus.map(d => [uuidDeDoc(d.id), d.id]));

const { rows: [ultimoIndexado] } = await pool.query(
  'SELECT modelo FROM eval_indexado ORDER BY id DESC LIMIT 1'
).catch(() => ({ rows: [null] }));
if (!ultimoIndexado) {
  console.error('[barrido] no hay registro en eval_indexado — corre primero 02_indexar.js');
  process.exit(1);
}
console.log(`[barrido] modelo indexado: ${ultimoIndexado.modelo}`);

// Todas las filas candidatas (a nivel de chunk) con su coseno y su ts_rank
// crudo -- se combinan en JS para cada alpha, así solo se consulta la base
// una vez por consulta, no una vez por alpha.
// COALESCE(embedding_comprension, embedding_local): misma señal vectorial que
// produccion (vectorService.js:29, buildScoringCTE) -- erratum post-#119, ver
// cierre de sesion de #115 (auditoria adversarial encontro que esta query
// usaba solo embedding_local, senal distinta a produccion para ~70% de los
// documentos de v1/v2). ORDER BY documento_id: determinismo del orden de
// filas entre corridas, mismo criterio que 00_ablation.js (#115).
const CANDIDATOS_SQL = `
  SELECT documento_id,
    1 - (COALESCE(embedding_comprension, embedding_local) <=> $1::vector) AS cos,
    LEAST(ts_rank(contenido_tsv, plainto_tsquery('spanish', $2)), 1.0) AS lex
  FROM base_conocimiento_enel
  WHERE embedding_local IS NOT NULL AND es_exitosa = TRUE AND is_active = TRUE AND documento_id IS NOT NULL
  ORDER BY documento_id
`;

const lineasPorAlpha = new Map(ALPHAS.map(a => [a, []]));

for (const q of queries) {
  const texto = await limpiarTexto(q.texto);
  const vector = await generarEmbeddingLocal(texto, { tipo: 'query' });
  const { rows } = await pool.query(CANDIDATOS_SQL, [JSON.stringify(vector), texto]);

  for (const alpha of ALPHAS) {
    const mejorPorDoc = new Map(); // documento_id -> score combinado maximo
    for (const r of rows) {
      const score = Number(r.cos) * alpha + Number(r.lex) * (1 - alpha);
      const actual = mejorPorDoc.get(r.documento_id);
      if (actual === undefined || score > actual) mejorPorDoc.set(r.documento_id, score);
    }
    // Desempate determinista por documento_id (score DESC, documento_id ASC) --
    // sin esto, dos documentos con score combinado empatado (frecuente en
    // alpha=0.0 puro-lexico) quedan en un orden dependiente del orden de
    // filas que devolvio Postgres, no reproducible entre corridas (#115).
    const top = [...mejorPorDoc.entries()]
      .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
      .slice(0, LIMIT);
    top.forEach(([documentoId, score], i) => {
      lineasPorAlpha.get(alpha).push(
        `${q.qid} Q0 ${docIdDe.get(documentoId) ?? documentoId} ${i + 1} ${score.toFixed(6)} v2-barrido-${modeloLabel}-a${alpha}`
      );
    });
  }
}

await fs.mkdir(dirResultados, { recursive: true });
for (const alpha of ALPHAS) {
  const nombre = `v2-barrido-${modeloLabel}-a${alpha.toFixed(1)}`;
  const ruta = path.join(dirResultados, `${nombre}.trec`);
  const lineas = lineasPorAlpha.get(alpha);
  await fs.writeFile(ruta, lineas.join('\n') + (lineas.length ? '\n' : ''));
  console.log(`[barrido] alpha=${alpha.toFixed(1)}: ${lineas.length} líneas → ${ruta}`);
}

await pool.end();
