#!/usr/bin/env node
// Uso:
//   node scripts/monitoreo_alpha_fb.js [--desde <ISO-date>] [--config-version <version>] [--json]
//
// Ejemplo:
//   node scripts/monitoreo_alpha_fb.js --desde 2026-10-01
//
// ECCP (#174) — consulta de monitoreo fija para decidir con datos si
// conviene encender el flag de #173, o diagnosticar una reversión si ya
// está encendido. Solo lectura, nunca escribe nada.
//
// Qué calcula, a partir de `impresiones_precedentes` (columnas de #174) y
// `feedback_precedentes`:
//   1. Promedio y mediana de |posicion_mostrada - posicion_contrafactual|
//      entre las impresiones con fusion_modo = 'alpha_fb' -- cuánto movió la
//      feromona el orden respecto a S_base puro.
//   2. % de esas impresiones donde el documento entró o salió del top-5
//      respecto a su posición contrafactual (el caso que más le importa al
//      abogado: si un precedente que antes no aparecía en el top-5 ahora sí,
//      o viceversa).
//   3. Tasa de feedback "útil" antes/después de --desde (o por
//      config_version, si se pasa), para ver si el reordenamiento coincide
//      con más o menos votos útiles.
//
// Limitación conocida (ver PR de #174): NO calcula un contrafactual de
// 'alpha_fb' para las impresiones servidas con 'ponderado' (modo sombra en
// el sentido "qué habría hecho alpha_fb si hubiera estado prendido") --
// comparar las dos fórmulas de fusión sobre el mismo conjunto de candidatos
// queda fuera de alcance de este lote. Tampoco calcula latencia p95 de
// pheromoneService -- no hay instrumentación de tiempos todavía (requeriría
// un issue aparte).
import 'dotenv/config';
import pool from '../src/db/database.js';

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

const desde = typeof argv.desde === 'string' ? argv.desde : null;
const configVersion = typeof argv['config-version'] === 'string' ? argv['config-version'] : null;

const percentil = (valoresOrdenados, p) => {
  if (!valoresOrdenados.length) return null;
  const idx = Math.min(valoresOrdenados.length - 1, Math.floor(p * valoresOrdenados.length));
  return valoresOrdenados[idx];
};

const main = async () => {
  const filtros = [];
  const params = [];
  if (desde) { params.push(desde); filtros.push(`created_at >= $${params.length}`); }
  if (configVersion) { params.push(configVersion); filtros.push(`config_version = $${params.length}`); }
  const where = filtros.length ? `WHERE ${filtros.join(' AND ')} AND fusion_modo = 'alpha_fb'` : "WHERE fusion_modo = 'alpha_fb'";

  const { rows: impresiones } = await pool.query(
    `SELECT posicion_mostrada, posicion_contrafactual, delta_feromona FROM impresiones_precedentes ${where}`,
    params
  );

  const deltas = impresiones
    .map((r) => Math.abs(r.posicion_mostrada - r.posicion_contrafactual))
    .sort((a, b) => a - b);

  const promedioDelta = deltas.length ? deltas.reduce((a, b) => a + b, 0) / deltas.length : null;
  const medianaDelta = percentil(deltas, 0.5);

  const cambiosTop5 = impresiones.filter((r) => {
    const estabaEnTop5 = r.posicion_contrafactual <= 5;
    const quedaEnTop5 = r.posicion_mostrada <= 5;
    return estabaEnTop5 !== quedaEnTop5;
  }).length;
  const porcentajeCambioTop5 = impresiones.length ? (cambiosTop5 / impresiones.length) * 100 : null;

  const { rows: tasaUtil } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE util = TRUE)::float / GREATEST(COUNT(*), 1) AS tasa_util,
       COUNT(*) AS total_votos
     FROM feedback_precedentes
     ${desde ? 'WHERE created_at >= $1' : ''}`,
    desde ? [desde] : []
  );

  const reporte = {
    filtros: { desde, config_version: configVersion },
    impresiones_alpha_fb_analizadas: impresiones.length,
    delta_posicion: {
      promedio: promedioDelta !== null ? Number(promedioDelta.toFixed(3)) : null,
      mediana: medianaDelta,
    },
    cambios_top5: {
      cantidad: cambiosTop5,
      porcentaje: porcentajeCambioTop5 !== null ? Number(porcentajeCambioTop5.toFixed(2)) : null,
    },
    feedback: {
      total_votos: Number(tasaUtil[0].total_votos),
      tasa_util: tasaUtil[0].tasa_util !== null ? Number(Number(tasaUtil[0].tasa_util).toFixed(4)) : null,
    },
    limitaciones: [
      'No calcula el contrafactual de alpha_fb para impresiones servidas con ponderado (modo sombra inverso) -- fuera de alcance de #174, ver PR.',
      'No calcula latencia p95 de pheromoneService -- sin instrumentación de tiempos todavía.',
    ],
  };

  if (argv.json) {
    console.log(JSON.stringify(reporte, null, 2));
  } else {
    console.log('[monitoreo_alpha_fb] Reporte ECCP #174');
    console.log(`  Filtros: desde=${desde ?? '(sin filtro)'}, config_version=${configVersion ?? '(sin filtro)'}`);
    console.log(`  Impresiones alpha_fb analizadas: ${reporte.impresiones_alpha_fb_analizadas}`);
    console.log(`  |Δposición| promedio / mediana: ${reporte.delta_posicion.promedio ?? 'N/A'} / ${reporte.delta_posicion.mediana ?? 'N/A'}`);
    console.log(`  Cambios de entrada/salida del top-5: ${reporte.cambios_top5.cantidad} (${reporte.cambios_top5.porcentaje ?? 'N/A'}%)`);
    console.log(`  Feedback -- total votos: ${reporte.feedback.total_votos}, tasa útil: ${reporte.feedback.tasa_util ?? 'N/A'}`);
    console.log(`  Limitaciones:\n    - ${reporte.limitaciones.join('\n    - ')}`);
  }

  await pool.end();
};

await main();
