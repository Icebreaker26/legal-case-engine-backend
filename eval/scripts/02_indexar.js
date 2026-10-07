// node --env-file=eval/.env.eval --import ./eval/guard.js eval/scripts/02_indexar.js [ruta-corpus.jsonl] [--modelo=Xenova/multilingual-e5-small]
//
// Indexa el corpus en base_conocimiento_enel usando el servicio real
// (memoriaService.indexarDocumento) — no reimplementa chunking ni inserts.
// Determinista: TRUNCATE + reindexado completo en orden fijo (por id),
// siempre de cero, nunca incremental.
//
// --modelo (#101): fija EMBEDDING_MODEL para esta corrida sin depender de
// exportarlo a mano en el shell antes de invocar node — reduce el riesgo de
// reindexar con el modelo equivocado por error humano. Se aplica ANTES de
// importar src/config/env.js (import dinámico, deliberado: un import estático
// de env.js se evaluaría antes de que este override corra).
import path from 'node:path';

const args = process.argv.slice(2);
const modeloArg = args.find((a) => a.startsWith('--modelo='))?.split('=')[1];
const rutaCorpus = args.find((a) => !a.startsWith('--')) ?? 'eval/fixtures/mini/corpus.jsonl';
if (modeloArg) process.env.EMBEDDING_MODEL = modeloArg;

const crypto = await import('node:crypto');
const fs = await import('node:fs/promises');
const { execSync } = await import('node:child_process');
const { default: pool } = await import('../../src/db/database.js');
const { limpiarTexto } = await import('../../src/modules/tutelas/services/cleanerService.js');
const { indexarDocumento } = await import('../../src/modules/tutelas/services/memoriaService.js');
const { env } = await import('../../src/config/env.js');
const { DocSchema, cargarYValidar } = await import('../schema.js');
const { uuidDeDoc } = await import('../config.js');

// Hash de los pesos ONNX descargados para el modelo activo (#101) — el
// nombre del modelo no alcanza para reproducibilidad: Xenova puede actualizar
// el repo de HuggingFace sin cambiar el id. null si el archivo no está en
// caché local todavía (p.ej. primera corrida en un entorno nuevo).
const hashPesosModelo = async (modelo) => {
  const dirBase = path.resolve('node_modules/@xenova/transformers/.cache', modelo, 'onnx');
  for (const nombre of ['model_quantized.onnx', 'model.onnx']) {
    try {
      const buf = await fs.readFile(path.join(dirBase, nombre));
      return { archivo: nombre, sha256: crypto.createHash('sha256').update(buf).digest('hex') };
    } catch {
      continue;
    }
  }
  return null;
};

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

const pesosModelo = await hashPesosModelo(env.EMBEDDING_MODEL);

await pool.query(`
  CREATE TABLE IF NOT EXISTS eval_indexado (
    id SERIAL PRIMARY KEY,
    modelo TEXT NOT NULL,
    corpus_sha256 TEXT NOT NULL,
    git_sha TEXT NOT NULL,
    fecha TIMESTAMPTZ DEFAULT NOW()
  )
`);
// #101: columna aditiva, nullable — registra el hash de los pesos ONNX
// descargados, no solo el nombre del modelo (que no cambia si Xenova
// actualiza el repo).
await pool.query('ALTER TABLE eval_indexado ADD COLUMN IF NOT EXISTS modelo_onnx_sha256 TEXT');
await pool.query(
  'INSERT INTO eval_indexado (modelo, corpus_sha256, git_sha, modelo_onnx_sha256) VALUES ($1, $2, $3, $4)',
  [env.EMBEDDING_MODEL, corpusSha, gitSha, pesosModelo?.sha256 ?? null],
);

const { rows: [{ count }] } = await pool.query('SELECT count(DISTINCT documento_id) FROM base_conocimiento_enel');
if (Number(count) !== corpus.length) {
  console.error(`[indexar] ADVERTENCIA: ${count} documento_id distintos en la base, ${corpus.length} en el corpus.`);
  process.exitCode = 1;
}

if (!pesosModelo) {
  console.warn(`[indexar] ADVERTENCIA: no se encontró el .onnx cacheado de ${env.EMBEDDING_MODEL} — modelo_onnx_sha256 quedó NULL. Corré el indexado al menos una vez para que @xenova/transformers lo descargue.`);
}

console.log(`[indexar] listo — ${corpus.length} documentos, modelo=${env.EMBEDDING_MODEL} (${pesosModelo ? `${pesosModelo.archivo} sha256=${pesosModelo.sha256.slice(0, 12)}…` : 'hash no disponible'}), corpus_sha256=${corpusSha.slice(0, 12)}…, git=${gitSha.slice(0, 7)}`);
await pool.end();
