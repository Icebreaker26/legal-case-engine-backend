#!/usr/bin/env node
// Uso:
//   node scripts/reindexar_embeddings.js --modelo <nombre-del-modelo> [--dry-run] [--batch-size N] [--permitir-host-remoto] [--categoria <nombre>]
//
// --categoria acota el reindexado a una sola categoría — útil para correr
// por lotes en producción, o para probar el script sobre datos descartables
// sin tocar el resto de la memoria legal real.
//
// Ejemplo:
//   node scripts/reindexar_embeddings.js --modelo Xenova/multilingual-e5-small --dry-run
//
// #101 — regenera embedding_local Y embedding_comprension de TODOS los
// documentos activos de base_conocimiento_enel con el modelo indicado, SIN
// re-chunkear (mismo contenido_legal/comprension_doc ya persistidos, solo
// se recalcula el vector) — ver RAG-00 regla 6: los reindexados van en
// scripts/ manuales, idempotentes, y nunca los ejecuta un agente contra
// producción, solo Alejandro.
//
// Por qué sin re-chunkear: cambiar de modelo de embeddings no requiere
// cambiar la estrategia de chunking — contenido_legal y comprension_doc ya
// están persistidos por chunk/documento desde la indexación original. Si
// algún día hace falta RE-CHUNKEAR (no solo re-embeber), ese es un script
// aparte que sí necesitaría leer documentos_fuente (#72 Fase 1) — fuera de
// alcance acá.
//
// Reanudable: cada fila se marca con embedding_modelo al actualizarse — una
// corrida interrumpida se retoma donde quedó, sin reprocesar lo ya hecho.
//
// Nunca actualiza embedding_local sin actualizar embedding_comprension (o
// viceversa) en la misma fila: ambos se recalculan y se escriben en el MISMO
// UPDATE. Riesgo señalado en #101/#124/#127: si quedaran desincronizados,
// COALESCE(embedding_comprension, embedding_local) compararía vectores de
// modelos distintos sin ningún error visible, solo resultados sin sentido.
import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const argv = Object.fromEntries(
  process.argv.slice(2).reduce((acc, arg, i, arr) => {
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = arr[i + 1];
      acc.push([key, next && !next.startsWith('--') ? next : true]);
    }
    return acc;
  }, [])
);

if (!argv.modelo || argv.modelo === true) {
  console.error('[reindexar] uso: node scripts/reindexar_embeddings.js --modelo <nombre> [--dry-run] [--batch-size N] [--permitir-host-remoto] [--categoria <nombre>]');
  process.exit(1);
}

const dryRun = argv['dry-run'] === true;
const batchSize = argv['batch-size'] ? Number(argv['batch-size']) : 20;
const permitirHostRemoto = argv['permitir-host-remoto'] === true;
const categoria = typeof argv.categoria === 'string' ? argv.categoria : null;

// ── Guard: nunca contra un host que no sea local, salvo flag explícito ─────
const dbUrl = new URL(process.env.DATABASE_URL ?? '');
const hostsLocales = ['localhost', '127.0.0.1'];
if (!hostsLocales.includes(dbUrl.hostname) && !permitirHostRemoto) {
  console.error(`[reindexar] DATABASE_URL apunta a "${dbUrl.hostname}", no a un host local (${hostsLocales.join('/')}).`);
  console.error('[reindexar] Este script nunca corre contra un host remoto sin --permitir-host-remoto explícito (ver RAG-00 regla 6: los reindexados los ejecuta solo Alejandro, nunca un agente).');
  process.exit(1);
}

// EMBEDDING_MODEL debe quedar fijado ANTES de importar aiService.js (que lo
// lee de src/config/env.js, parseado una sola vez al importarse) — por eso
// los imports de pool/aiService son dinámicos, después de esta línea, en vez
// de imports estáticos arriba del archivo.
process.env.EMBEDDING_MODEL = argv.modelo;

const { default: pool } = await import('../src/db/database.js');
const { generarEmbeddingLocal } = await import('../src/modules/tutelas/services/aiService.js');

// ── Hash del archivo ONNX cacheado, para documentar la versión exacta del
// modelo usada (#101: "fijar y documentar... hash de los pesos ONNX
// descargados, no solo el nombre del modelo") ───────────────────────────────
const hashModeloCacheado = async (modelo) => {
  const rutaOnnx = path.join('node_modules/@xenova/transformers/.cache', modelo, 'onnx/model_quantized.onnx');
  try {
    const buffer = await fs.readFile(rutaOnnx);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  } catch {
    return null; // modelo aún no descargado/cacheado en este momento — se resuelve tras la primera llamada
  }
};

const construirTextoComprension = (comprensionDoc) =>
  comprensionDoc
    ? `${comprensionDoc.que_resuelve}. ${(comprensionDoc.derechos_involucrados || []).join('. ')}`
    : null;

// $2 (categoría) puede ser NULL — "AND ($2::text IS NULL OR categoria = $2)"
// es un no-op cuando no se filtra, evita tener dos variantes de la query.
const contarPendientes = async (modelo, categoria) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS total FROM base_conocimiento_enel
     WHERE is_active = TRUE AND (embedding_modelo IS DISTINCT FROM $1)
       AND ($2::text IS NULL OR categoria = $2)`,
    [modelo, categoria]
  );
  return Number(rows[0].total);
};

const siguienteLote = async (modelo, categoria, limite) => {
  const { rows } = await pool.query(
    `SELECT id, documento_id, contenido_legal, comprension_doc
     FROM base_conocimiento_enel
     WHERE is_active = TRUE AND (embedding_modelo IS DISTINCT FROM $1)
       AND ($2::text IS NULL OR categoria = $2)
     ORDER BY id
     LIMIT $3`,
    [modelo, categoria, limite]
  );
  return rows;
};

const main = async () => {
  const inicio = Date.now();
  const pendientesAntes = await contarPendientes(argv.modelo, categoria);

  console.log(`[reindexar] modelo objetivo: ${argv.modelo}`);
  console.log(`[reindexar] host: ${dbUrl.hostname} (${permitirHostRemoto ? 'remoto permitido explícitamente' : 'local'})`);
  console.log(`[reindexar] categoría: ${categoria ?? '(todas)'}`);
  console.log(`[reindexar] filas pendientes (embedding_modelo distinto de "${argv.modelo}"): ${pendientesAntes}`);

  if (dryRun) {
    const muestra = await siguienteLote(argv.modelo, categoria, 5);
    console.log(`[reindexar] --dry-run: no se escribe nada. Muestra de hasta 5 filas que se actualizarían:`);
    muestra.forEach(r => console.log(`  - id=${r.id} documento_id=${r.documento_id} con_comprension=${r.comprension_doc != null}`));
    await pool.end();
    return;
  }

  let actualizadas = 0;
  let fallidas = 0;

  for (;;) {
    const lote = await siguienteLote(argv.modelo, categoria, batchSize);
    if (lote.length === 0) break;

    for (const fila of lote) {
      try {
        const vectorLocal = await generarEmbeddingLocal(fila.contenido_legal);
        const textoComprension = construirTextoComprension(fila.comprension_doc);
        const vectorComprension = textoComprension ? await generarEmbeddingLocal(textoComprension) : null;

        // Un solo UPDATE para los dos vectores + el marcador de modelo —
        // nunca uno sin el otro (ver nota de riesgo arriba del archivo).
        await pool.query(
          `UPDATE base_conocimiento_enel
           SET embedding_local = $1, embedding_comprension = $2, embedding_modelo = $3
           WHERE id = $4`,
          [JSON.stringify(vectorLocal), vectorComprension ? JSON.stringify(vectorComprension) : null, argv.modelo, fila.id]
        );
        actualizadas++;
      } catch (err) {
        fallidas++;
        console.error(`[reindexar] fila id=${fila.id} documento_id=${fila.documento_id} falló: ${err.message}`);
      }
    }
    console.log(`[reindexar] progreso: ${actualizadas} actualizadas, ${fallidas} fallidas (de ${pendientesAntes} pendientes al inicio)`);
  }

  const hash = await hashModeloCacheado(argv.modelo);
  const duracionSeg = ((Date.now() - inicio) / 1000).toFixed(1);

  const reporte = {
    modelo: argv.modelo,
    modelo_onnx_sha256: hash,
    host: dbUrl.hostname,
    categoria: categoria ?? null,
    pendientes_al_inicio: pendientesAntes,
    actualizadas,
    fallidas,
    duracion_segundos: Number(duracionSeg),
    fecha: new Date().toISOString(),
  };

  const dirReportes = 'scripts/reindex_reports';
  await fs.mkdir(dirReportes, { recursive: true });
  const rutaReporte = path.join(dirReportes, `${Date.now()}-${argv.modelo.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
  await fs.writeFile(rutaReporte, JSON.stringify(reporte, null, 2));

  console.log(`[reindexar] listo — ${actualizadas} actualizadas, ${fallidas} fallidas, ${duracionSeg}s`);
  console.log(`[reindexar] hash sha256 del modelo ONNX cacheado: ${hash ?? '(no se pudo calcular — revisar node_modules/@xenova/transformers/.cache)'}`);
  console.log(`[reindexar] reporte → ${rutaReporte}`);

  if (fallidas > 0) {
    console.error(`[reindexar] ${fallidas} filas fallaron — volver a correr el mismo comando las reintenta (son las únicas que seguirán con embedding_modelo distinto de "${argv.modelo}").`);
    process.exitCode = 1;
  }

  await pool.end();
};

await main();
