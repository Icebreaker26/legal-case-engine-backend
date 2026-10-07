// node --env-file=eval/.env.eval --import ./eval/guard.js eval/scripts/04_correr.js --exp E01-baseline-ponderado
//
// Corre una configuración pre-registrada contra el corpus ya indexado,
// usando el pipeline real de producción (recuperarPrecedentes), y escribe
// el run en formato TREC. Determinista: mismo input + mismo commit +
// mismo modelo → mismo archivo byte-idéntico.
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execSync } from 'node:child_process';
import pool from '../../src/db/database.js';
import { limpiarTexto } from '../../src/modules/tutelas/services/cleanerService.js';
import { recuperarPrecedentes } from '../../src/modules/tutelas/services/consultaService.js';
import { extraerDatosTutela } from '../../src/modules/tutelas/services/extractorService.js';
import { env } from '../../src/config/env.js';
import { DocSchema, QuerySchema, ExperimentoSchema, cargarYValidar } from '../schema.js';
import { uuidDeDoc } from '../config.js';

const argv = Object.fromEntries(
  process.argv.slice(2).reduce((acc, arg, i, arr) => {
    if (arg.startsWith('--')) acc.push([arg.slice(2), arr[i + 1]]);
    return acc;
  }, [])
);

const rutaCorpus = argv.corpus ?? 'eval/fixtures/mini/corpus.jsonl';
const rutaQueries = argv.queries ?? 'eval/fixtures/mini/queries.jsonl';
const dirResultados = argv.out ?? 'eval/results/runs';

if (!argv.exp) {
  console.error('[correr] uso: --exp <id-de-experimentos.json> [--corpus ruta] [--queries ruta] [--out dir]');
  process.exit(1);
}

const experimentos = JSON.parse(await fs.readFile('eval/experimentos.json', 'utf-8')).map(e => ExperimentoSchema.parse(e));
const exp = experimentos.find(e => e.id === argv.exp);
if (!exp) {
  console.error(`[correr] experimento "${argv.exp}" no existe en eval/experimentos.json. Disponibles: ${experimentos.map(e => e.id).join(', ')}`);
  process.exit(1);
}

const corpus = await cargarYValidar(rutaCorpus, DocSchema);
const queries = (await cargarYValidar(rutaQueries, QuerySchema)).sort((a, b) => a.qid.localeCompare(b.qid));

const corpusSha = crypto.createHash('sha256').update(await fs.readFile(rutaCorpus)).digest('hex');
const docIdDe = new Map(corpus.map(d => [uuidDeDoc(d.id), d.id]));

// ── Verificar que la base indexada corresponde a este corpus+modelo ────────
const { rows: [ultimoIndexado] } = await pool.query(
  'SELECT modelo, corpus_sha256 FROM eval_indexado ORDER BY id DESC LIMIT 1'
).catch(() => ({ rows: [null] }));

if (!ultimoIndexado) {
  console.error('[correr] no hay registro en eval_indexado — corre primero 02_indexar.js');
  process.exit(1);
}
if (ultimoIndexado.modelo !== env.EMBEDDING_MODEL) {
  console.error(`[correr] la base fue indexada con "${ultimoIndexado.modelo}" pero EMBEDDING_MODEL="${env.EMBEDDING_MODEL}" — reindexar antes de correr.`);
  process.exit(1);
}
if (ultimoIndexado.corpus_sha256 !== corpusSha) {
  console.error('[correr] el corpus.jsonl cambió desde el último reindexado — reindexar antes de correr.');
  process.exit(1);
}

// ── Correr ───────────────────────────────────────────────────────────────
const lineasTrec = [];
const metaPorQuery = {};

for (const q of queries) {
  const texto = await limpiarTexto(q.texto);
  const tutela = {
    contenido_original: texto,
    analisis_comprension: exp.comprensionQuery ? q.comprension : null,
  };

  let categoria = null;
  let categoriaResuelta = null;
  if (exp.categoria === 'extraida') {
    const datos = await extraerDatosTutela(texto);
    categoria = datos.derecho_vulnerado;
    categoriaResuelta = categoria;
  } else if (exp.categoria === 'etiquetada') {
    categoria = q.derecho_vulnerado;
    categoriaResuelta = categoria;
  }

  const hits = await recuperarPrecedentes({ tutela, categoria, limit: exp.limit, estrategia: exp.estrategia, fusion: exp.fusion, alpha: exp.alpha });

  // Score sintético = posición mostrada (limit - rank + 1), no el score crudo:
  // ranx/trec_eval reordenan por score, y en la rama ponderada con categoría
  // el "complemento" (ver vectorService.js) puede tener score crudo mayor
  // que resultados de la categoría pero mostrarse después — el score TREC
  // debe reflejar el orden que el abogado realmente ve, no el score interno.
  hits.forEach((h, i) => {
    lineasTrec.push(`${q.qid} Q0 ${docIdDe.get(h.documento_id) ?? h.documento_id} ${i + 1} ${exp.limit - i} ${exp.id}`);
  });

  metaPorQuery[q.qid] = {
    categoria_resuelta: categoriaResuelta,
    scores_reales: hits.map(h => ({ documento_id: docIdDe.get(h.documento_id) ?? h.documento_id, score: h.score })),
  };
}

await fs.mkdir(dirResultados, { recursive: true });
const rutaRun = path.join(dirResultados, `${exp.id}.trec`);
const rutaMeta = path.join(dirResultados, `${exp.id}.meta.json`);

await fs.writeFile(rutaRun, lineasTrec.join('\n') + (lineasTrec.length ? '\n' : ''));
await fs.writeFile(rutaMeta, JSON.stringify({
  experimento: exp,
  git_sha: execSync('git rev-parse HEAD').toString().trim(),
  embedding_model: env.EMBEDDING_MODEL,
  corpus_sha256: corpusSha,
  fecha: new Date().toISOString(),
  por_query: metaPorQuery,
}, null, 2));

console.log(`[correr] ${exp.id}: ${lineasTrec.length} líneas → ${rutaRun}`);
await pool.end();
