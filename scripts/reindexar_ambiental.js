#!/usr/bin/env node
// Uso:
//   node scripts/reindexar_ambiental.js --modelo <nombre-del-modelo> [--dry-run] [--batch-size N] [--permitir-host-remoto] [--expediente <uuid>]
//
// Ejemplo:
//   node scripts/reindexar_ambiental.js --modelo Xenova/multilingual-e5-small --dry-run
//
// #195 (épica #199) — llena `chunks_ambiental` (migración 1786700000000) con
// el mismo camino de indexación que la app (reindexarTrozosExpediente en
// ambientalEmbeddingService.js): trozos de 1.500/300 caracteres de
// `contenido_texto` y del último resumen + que_ordena, con vectores del
// modelo indicado (prefijo `passage: ` para e5) y `embedding_modelo`
// registrado por trozo. Análogo a scripts/reindexar_embeddings.js (tutelas):
// los reindexados son scripts manuales e idempotentes que corre solo
// Alejandro, nunca un agente contra producción.
//
// Un expediente activo está PENDIENTE si alguna de sus fuentes con texto no
// tiene trozos activos, o tiene alguno con un modelo distinto del objetivo
// (IS DISTINCT FROM: también atrapa NULL), o si tiene trozos activos de una
// fuente que ya no tiene texto. Reanudable: lo ya reindexado deja de estar
// pendiente, así que una corrida interrumpida se retoma donde quedó.
//
// Límite: si el texto de un expediente cambió sin pasar por la app y el
// modelo es el mismo, este script no lo detecta (no compara contenido). La
// app reindexa sola al crear, editar el contenido, guardar o consolidar el
// análisis y en POST /expedientes/:id/generar-embedding.
//
// No toca `embeddings_ambiental`: buscarSimilares la sigue leyendo hasta #196.
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

const USO = 'node scripts/reindexar_ambiental.js --modelo <nombre> [--dry-run] [--batch-size N] [--permitir-host-remoto] [--expediente <uuid>]';
if (!argv.modelo || argv.modelo === true) {
  console.error(`[reindexar-ambiental] uso: ${USO}`);
  process.exit(1);
}

const dryRun = argv['dry-run'] === true;
const batchSize = argv['batch-size'] ? Number(argv['batch-size']) : 20;
const permitirHostRemoto = argv['permitir-host-remoto'] === true;
const expedienteFiltro = typeof argv.expediente === 'string' ? argv.expediente : null;

if (!Number.isInteger(batchSize) || batchSize < 1) {
  console.error('[reindexar-ambiental] --batch-size debe ser un entero positivo.');
  process.exit(1);
}

// ── Guard: nunca contra un host que no sea local, salvo flag explícito ─────
const dbUrl = new URL(process.env.DATABASE_URL ?? '');
const hostsLocales = ['localhost', '127.0.0.1'];
if (!hostsLocales.includes(dbUrl.hostname) && !permitirHostRemoto) {
  console.error(`[reindexar-ambiental] DATABASE_URL apunta a "${dbUrl.hostname}", no a un host local (${hostsLocales.join('/')}).`);
  console.error('[reindexar-ambiental] Este script nunca corre contra un host remoto sin --permitir-host-remoto explícito (los reindexados los ejecuta solo Alejandro, nunca un agente).');
  process.exit(1);
}

// EMBEDDING_MODEL debe quedar fijado ANTES de importar env.js/aiService.js
// (se parsea una sola vez al importarse): por eso los imports son dinámicos.
process.env.EMBEDDING_MODEL = argv.modelo;

const { default: pool } = await import('../src/db/database.js');
const { leerTextosExpediente, reindexarTrozosExpediente, FUENTES_TROZOS } = await import('../src/modules/ambiental/services/ambientalEmbeddingService.js');

const hashModeloCacheado = async (modelo) => {
  const rutaOnnx = path.join('node_modules/@xenova/transformers/.cache', modelo, 'onnx/model_quantized.onnx');
  try {
    const buffer = await fs.readFile(rutaOnnx);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  } catch {
    return null;
  }
};

// Lote de expedientes activos por keyset sobre id (estable aunque otros
// procesos escriban). $2 puede ser NULL (sin filtro de expediente).
const loteExpedientes = async (despuesDe, limite) => {
  const { rows } = await pool.query(
    `SELECT id, titulo FROM expedientes_ambientales
     WHERE is_active = TRUE
       AND ($1::uuid IS NULL OR id > $1::uuid)
       AND ($2::uuid IS NULL OR id = $2::uuid)
     ORDER BY id
     LIMIT $3`,
    [despuesDe, expedienteFiltro, limite]
  );
  return rows;
};

// Estado de un expediente frente al modelo objetivo.
const evaluar = async (expedienteId, modelo) => {
  const textos = await leerTextosExpediente(expedienteId, pool);
  const { rows } = await pool.query(
    `SELECT fuente, COUNT(*)::int AS trozos,
            COUNT(*) FILTER (WHERE embedding_modelo IS DISTINCT FROM $2)::int AS con_otro_modelo
     FROM chunks_ambiental
     WHERE expediente_id = $1 AND is_active = TRUE
     GROUP BY fuente`,
    [expedienteId, modelo]
  );
  const porFuente = Object.fromEntries(rows.map((r) => [r.fuente, r]));
  const motivos = [];
  for (const fuente of FUENTES_TROZOS) {
    const actual = porFuente[fuente];
    if (textos?.[fuente]) {
      if (!actual) motivos.push(`${fuente}: sin trozos`);
      else if (actual.con_otro_modelo > 0) motivos.push(`${fuente}: ${actual.con_otro_modelo}/${actual.trozos} trozos con otro modelo`);
    } else if (actual) {
      motivos.push(`${fuente}: ${actual.trozos} trozos sin texto que los respalde`);
    }
  }
  const sinTexto = !textos?.contenido && !textos?.analisis;
  return { motivos, sinTexto };
};

const main = async () => {
  const inicio = Date.now();
  console.log(`[reindexar-ambiental] modelo objetivo: ${argv.modelo}`);
  console.log(`[reindexar-ambiental] host: ${dbUrl.hostname} (${permitirHostRemoto ? 'remoto permitido explícitamente' : 'local'})`);
  console.log(`[reindexar-ambiental] expediente: ${expedienteFiltro ?? '(todos los activos)'}`);
  console.log(`[reindexar-ambiental] modo: ${dryRun ? '--dry-run (no escribe nada)' : 'escritura'}`);

  let revisados = 0;
  let pendientes = 0;
  let reindexados = 0;
  let fallidos = 0;
  let trozosEscritos = 0;
  const sinTexto = [];
  const muestraPendientes = [];

  let ultimo = null;
  for (;;) {
    const lote = await loteExpedientes(ultimo, batchSize);
    if (lote.length === 0) break;
    ultimo = lote[lote.length - 1].id;

    for (const exp of lote) {
      revisados++;
      const estado = await evaluar(exp.id, argv.modelo);
      if (estado.sinTexto) sinTexto.push(exp.id);
      if (estado.motivos.length === 0) continue;

      pendientes++;
      if (muestraPendientes.length < 10) muestraPendientes.push(`${exp.id} — ${estado.motivos.join('; ')}`);
      if (dryRun) continue;

      try {
        const r = await reindexarTrozosExpediente(exp.id, pool);
        trozosEscritos += (r?.contenido ?? 0) + (r?.analisis ?? 0);
        reindexados++;
      } catch (err) {
        fallidos++;
        console.error(`[reindexar-ambiental] expediente ${exp.id} falló: ${err.message}`);
      }
    }
    console.log(`[reindexar-ambiental] progreso: ${revisados} revisados, ${pendientes} pendientes, ${reindexados} reindexados, ${fallidos} fallidos`);
  }

  console.log(`[reindexar-ambiental] expedientes activos revisados: ${revisados}`);
  console.log(`[reindexar-ambiental] pendientes frente a "${argv.modelo}": ${pendientes}`);
  if (muestraPendientes.length) {
    console.log('[reindexar-ambiental] muestra de pendientes (hasta 10):');
    muestraPendientes.forEach((l) => console.log(`  - ${l}`));
  }
  console.log(`[reindexar-ambiental] sin texto ni análisis (no se pueden indexar): ${sinTexto.length}`);
  sinTexto.slice(0, 10).forEach((id) => console.log(`  - ${id}`));

  if (dryRun) {
    await pool.end();
    return;
  }

  const hash = await hashModeloCacheado(argv.modelo);
  const duracionSeg = ((Date.now() - inicio) / 1000).toFixed(1);
  const reporte = {
    modelo: argv.modelo,
    modelo_onnx_sha256: hash,
    host: dbUrl.hostname,
    expediente: expedienteFiltro,
    revisados,
    pendientes_al_inicio: pendientes,
    reindexados,
    fallidos,
    trozos_escritos: trozosEscritos,
    sin_texto: sinTexto.length,
    duracion_segundos: Number(duracionSeg),
    fecha: new Date().toISOString(),
  };

  const dirReportes = 'scripts/reindex_reports';
  await fs.mkdir(dirReportes, { recursive: true });
  const rutaReporte = path.join(dirReportes, `${Date.now()}-ambiental-${argv.modelo.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
  await fs.writeFile(rutaReporte, JSON.stringify(reporte, null, 2));

  console.log(`[reindexar-ambiental] listo — ${reindexados} reindexados (${trozosEscritos} trozos), ${fallidos} fallidos, ${duracionSeg}s`);
  console.log(`[reindexar-ambiental] reporte → ${rutaReporte}`);

  if (fallidos > 0) {
    console.error(`[reindexar-ambiental] ${fallidos} expedientes fallaron — volver a correr el mismo comando los reintenta.`);
    process.exitCode = 1;
  }

  await pool.end();
};

await main();
