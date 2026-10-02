// node --env-file=eval/.env.eval --import ./eval/guard.js eval/scripts/02_indexar.js [ruta-corpus.jsonl]
//
// Indexa el corpus en base_conocimiento_enel usando el servicio real
// (memoriaService.indexarDocumento) — no reimplementa chunking ni inserts.
// Determinista: TRUNCATE + reindexado completo en orden fijo (por id),
// siempre de cero, nunca incremental.
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { execSync } from 'node:child_process';
import pool from '../../src/db/database.js';
import { limpiarTexto } from '../../src/modules/tutelas/services/cleanerService.js';
import { indexarDocumento } from '../../src/modules/tutelas/services/memoriaService.js';
import { env } from '../../src/config/env.js';
import { DocSchema, cargarYValidar } from '../schema.js';
import { uuidDeDoc } from '../config.js';

const rutaCorpus = process.argv[2] ?? 'eval/fixtures/mini/corpus.jsonl';

const corpus = (await cargarYValidar(rutaCorpus, DocSchema))
  .sort((a, b) => a.id.localeCompare(b.id)); // orden determinista, no el de aparición en el archivo

const corpusSha = crypto.createHash('sha256').update(await fs.readFile(rutaCorpus)).digest('hex');
const gitSha = execSync('git rev-parse HEAD').toString().trim();

await pool.query('TRUNCATE base_conocimiento_enel');

for (const d of corpus) {
  const textoLimpio = await limpiarTexto(d.texto);
  await indexarDocumento({
    texto: textoLimpio,
    categoria: d.categoria,
    titulo: d.titulo,
    documentoId: uuidDeDoc(d.id),
    esExitosa: d.esExitosa,
    comprensionDoc: d.comprension,
  });
  console.log(`[indexar] ${d.id} → ${uuidDeDoc(d.id)}`);
}

await pool.query(`
  CREATE TABLE IF NOT EXISTS eval_indexado (
    id SERIAL PRIMARY KEY,
    modelo TEXT NOT NULL,
    corpus_sha256 TEXT NOT NULL,
    git_sha TEXT NOT NULL,
    fecha TIMESTAMPTZ DEFAULT NOW()
  )
`);
await pool.query(
  'INSERT INTO eval_indexado (modelo, corpus_sha256, git_sha) VALUES ($1, $2, $3)',
  [env.EMBEDDING_MODEL, corpusSha, gitSha]
);

const { rows: [{ count }] } = await pool.query('SELECT count(DISTINCT documento_id) FROM base_conocimiento_enel');
if (Number(count) !== corpus.length) {
  console.error(`[indexar] ADVERTENCIA: ${count} documento_id distintos en la base, ${corpus.length} en el corpus.`);
  process.exitCode = 1;
}

console.log(`[indexar] listo — ${corpus.length} documentos, modelo=${env.EMBEDDING_MODEL}, corpus_sha256=${corpusSha.slice(0, 12)}…, git=${gitSha.slice(0, 7)}`);
await pool.end();
