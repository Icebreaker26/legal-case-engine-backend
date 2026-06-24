import pool from '../../../db/database.js';
import logger from '../../../utils/logger.js';

export const getScoreRiesgo = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        t.id,
        t.radicado,
        t.accionante,
        t.estado,
        t.prioridad,
        t.fecha_vencimiento,
        t.derecho_vulnerado,
        COALESCE(u.nombre, 'Sin asignar') AS responsable,
        CEIL(EXTRACT(EPOCH FROM (t.fecha_vencimiento::timestamptz - NOW())) / 86400) AS dias_restantes,
        (
          SELECT COUNT(*) FROM requerimientos_internos r
          WHERE r.tutela_id = t.id AND r.estado IN ('Pendiente', 'En Gestión')
        ) AS reqs_pendientes,
        (
          SELECT COUNT(*) FROM historial_acciones ha
          WHERE ha.tutela_id = t.id
        ) AS total_acciones
      FROM tutelas t
      LEFT JOIN global_usuarios u ON u.id = t.responsable_uuid
      WHERE t.is_active = TRUE AND t.estado != 'Respondida'
      ORDER BY t.fecha_vencimiento ASC
    `);

    const tutelas = rows.map(t => {
      const dias = parseInt(t.dias_restantes) || 0;
      const reqs = parseInt(t.reqs_pendientes) || 0;
      const acciones = parseInt(t.total_acciones) || 0;

      // Score 0-100: más alto = más riesgo
      let score = 0;

      // Factor días restantes (40 pts)
      if (dias <= 0) score += 40;
      else if (dias <= 1) score += 35;
      else if (dias <= 3) score += 25;
      else if (dias <= 7) score += 15;
      else if (dias <= 15) score += 5;

      // Factor prioridad (30 pts)
      if (t.prioridad === 'Alta') score += 30;
      else if (t.prioridad === 'Media') score += 15;

      // Factor requerimientos sin responder (20 pts)
      score += Math.min(reqs * 7, 20);

      // Factor poca actividad (10 pts)
      if (acciones === 0) score += 10;
      else if (acciones <= 2) score += 5;

      score = Math.min(score, 100);

      const nivel = score >= 70 ? 'Alto' : score >= 40 ? 'Medio' : 'Bajo';

      return {
        id: t.id,
        radicado: t.radicado,
        accionante: t.accionante,
        estado: t.estado,
        prioridad: t.prioridad,
        fecha_vencimiento: t.fecha_vencimiento,
        derecho_vulnerado: t.derecho_vulnerado,
        responsable: t.responsable,
        dias_restantes: dias,
        reqs_pendientes: reqs,
        total_acciones: acciones,
        score,
        nivel
      };
    });

    // Ordenar por score descendente
    tutelas.sort((a, b) => b.score - a.score);

    res.json(tutelas);
  } catch (error) {
    logger.error('getScoreRiesgo error', { error: error.message });
    res.status(500).json({ error: 'Error al calcular scores de riesgo.' });
  }
};

export const getPatronesFallo = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COALESCE(NULLIF(TRIM(t.resultado_fallo), ''), 'Sin fallo') AS fallo,
        COALESCE(NULLIF(TRIM(t.derecho_vulnerado), ''), 'No clasificado') AS derecho,
        COALESCE(NULLIF(TRIM(t.juzgado), ''), 'No identificado') AS juzgado,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE t.resultado_fallo = 'Favorable') AS favorables,
        COUNT(*) FILTER (WHERE t.resultado_fallo = 'Desfavorable') AS desfavorables
      FROM tutelas t
      WHERE t.is_active = TRUE
      GROUP BY fallo, derecho, juzgado
      ORDER BY total DESC
    `);

    // Resumen por derecho vulnerado
    const { rows: porDerecho } = await pool.query(`
      SELECT
        COALESCE(NULLIF(TRIM(derecho_vulnerado), ''), 'No clasificado') AS derecho,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE resultado_fallo = 'Favorable') AS favorables,
        COUNT(*) FILTER (WHERE resultado_fallo = 'Desfavorable') AS desfavorables,
        COUNT(*) FILTER (WHERE resultado_fallo IS NULL OR resultado_fallo = '') AS sin_fallo,
        ROUND(
          COUNT(*) FILTER (WHERE resultado_fallo = 'Favorable')::numeric /
          NULLIF(COUNT(*) FILTER (WHERE resultado_fallo IS NOT NULL AND resultado_fallo != ''), 0) * 100, 1
        ) AS tasa_exito
      FROM tutelas
      WHERE is_active = TRUE
      GROUP BY derecho
      ORDER BY total DESC
    `);

    // Resumen por juzgado
    const { rows: porJuzgado } = await pool.query(`
      SELECT
        COALESCE(NULLIF(TRIM(juzgado), ''), 'No identificado') AS juzgado,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE resultado_fallo = 'Favorable') AS favorables,
        COUNT(*) FILTER (WHERE resultado_fallo = 'Desfavorable') AS desfavorables,
        ROUND(
          COUNT(*) FILTER (WHERE resultado_fallo = 'Favorable')::numeric /
          NULLIF(COUNT(*) FILTER (WHERE resultado_fallo IS NOT NULL AND resultado_fallo != ''), 0) * 100, 1
        ) AS tasa_exito
      FROM tutelas
      WHERE is_active = TRUE
      GROUP BY juzgado
      ORDER BY total DESC
    `);

    res.json({
      detalle: rows,
      porDerecho: porDerecho.map(r => ({
        derecho:       r.derecho,
        total:         parseInt(r.total),
        favorables:    parseInt(r.favorables),
        desfavorables: parseInt(r.desfavorables),
        sin_fallo:     parseInt(r.sin_fallo),
        tasa_exito:    r.tasa_exito !== null ? parseFloat(r.tasa_exito) : null,
      })),
      porJuzgado: porJuzgado.map(r => ({
        juzgado:       r.juzgado,
        total:         parseInt(r.total),
        favorables:    parseInt(r.favorables),
        desfavorables: parseInt(r.desfavorables),
        tasa_exito:    r.tasa_exito !== null ? parseFloat(r.tasa_exito) : null,
      })),
    });
  } catch (error) {
    logger.error('getPatronesFallo error', { error: error.message });
    res.status(500).json({ error: 'Error al calcular patrones de fallo.' });
  }
};

export const getEficienciaRAG = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        categoria,
        COUNT(*) AS total_documentos,
        ROUND(AVG(relevancia_score), 2) AS score_promedio,
        MAX(relevancia_score) AS score_max,
        MIN(relevancia_score) AS score_min,
        COUNT(*) FILTER (WHERE relevancia_score >= 3) AS muy_utiles,
        COUNT(*) FILTER (WHERE relevancia_score <= -3) AS candidatos_eliminar
      FROM base_conocimiento_enel
      WHERE is_active = TRUE
      GROUP BY categoria
      ORDER BY score_promedio DESC
    `);

    const { rows: top } = await pool.query(`
      SELECT titulo_referencia, categoria, relevancia_score, created_at
      FROM base_conocimiento_enel
      WHERE is_active = TRUE
      ORDER BY relevancia_score DESC
      LIMIT 10
    `);

    const { rows: bottom } = await pool.query(`
      SELECT titulo_referencia, categoria, relevancia_score, created_at
      FROM base_conocimiento_enel
      WHERE is_active = TRUE
      ORDER BY relevancia_score ASC
      LIMIT 10
    `);

    const { rows: totales } = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE relevancia_score >= 3) AS muy_utiles,
        COUNT(*) FILTER (WHERE relevancia_score <= -3) AS candidatos_eliminar,
        ROUND(AVG(relevancia_score), 2) AS score_promedio
      FROM base_conocimiento_enel
      WHERE is_active = TRUE
    `);

    res.json({
      resumen: totales[0],
      porCategoria: rows.map(r => ({
        categoria:          r.categoria || 'Sin categoría',
        total_documentos:   parseInt(r.total_documentos),
        score_promedio:     parseFloat(r.score_promedio),
        score_max:          parseInt(r.score_max),
        score_min:          parseInt(r.score_min),
        muy_utiles:         parseInt(r.muy_utiles),
        candidatos_eliminar: parseInt(r.candidatos_eliminar),
      })),
      top_documentos:    top,
      bottom_documentos: bottom,
    });
  } catch (error) {
    logger.error('getEficienciaRAG error', { error: error.message });
    res.status(500).json({ error: 'Error al calcular eficiencia del RAG.' });
  }
};

export const getCargaAbogados = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        u.nombre,
        u.id AS usuario_uuid,
        COUNT(t.id) FILTER (WHERE t.estado != 'Respondida') AS casos_activos,
        COUNT(t.id) FILTER (WHERE t.estado = 'Respondida') AS casos_cerrados,
        COUNT(t.id) AS casos_total,
        COUNT(t.id) FILTER (WHERE t.prioridad = 'Alta' AND t.estado != 'Respondida') AS urgentes,
        COUNT(t.id) FILTER (WHERE t.prioridad = 'Media' AND t.estado != 'Respondida') AS medios,
        COUNT(t.id) FILTER (WHERE t.prioridad = 'Baja' AND t.estado != 'Respondida') AS bajos,
        ROUND(
          COUNT(t.id) FILTER (WHERE t.estado = 'Respondida')::numeric /
          NULLIF(COUNT(t.id), 0) * 100, 1
        ) AS tasa_cierre,
        MIN(t.fecha_vencimiento) FILTER (WHERE t.estado != 'Respondida') AS proximo_vencimiento
      FROM global_usuarios u
      LEFT JOIN tutelas t ON t.responsable_uuid = u.id AND t.is_active = TRUE
      WHERE u.is_active = TRUE
      GROUP BY u.id, u.nombre
      HAVING COUNT(t.id) > 0
      ORDER BY casos_activos DESC
    `);

    res.json(rows.map(r => ({
      nombre:             r.nombre,
      casos_activos:      parseInt(r.casos_activos)  || 0,
      casos_cerrados:     parseInt(r.casos_cerrados) || 0,
      casos_total:        parseInt(r.casos_total)    || 0,
      urgentes:           parseInt(r.urgentes)       || 0,
      medios:             parseInt(r.medios)         || 0,
      bajos:              parseInt(r.bajos)          || 0,
      tasa_cierre:        r.tasa_cierre !== null ? parseFloat(r.tasa_cierre) : 0,
      proximo_vencimiento: r.proximo_vencimiento,
    })));
  } catch (error) {
    logger.error('getCargaAbogados error', { error: error.message });
    res.status(500).json({ error: 'Error al calcular carga por abogado.' });
  }
};

export const getTiempoRespuestaArea = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        g.nombre AS grupo,
        r.prioridad,
        COUNT(r.id) AS total,
        COUNT(r.id) FILTER (WHERE r.estado = 'Respondido') AS respondidos,
        ROUND(
          AVG(
            EXTRACT(EPOCH FROM (r.fecha_respuesta - r.created_at)) / 86400
          ) FILTER (WHERE r.estado = 'Respondido' AND r.fecha_respuesta IS NOT NULL),
          1
        ) AS promedio_dias,
        ROUND(
          AVG(
            EXTRACT(EPOCH FROM (r.fecha_respuesta - r.created_at)) / 86400
          ) FILTER (WHERE r.estado = 'Respondido' AND r.prioridad = 'Alta' AND r.fecha_respuesta IS NOT NULL),
          1
        ) AS promedio_dias_alta,
        ROUND(
          AVG(
            EXTRACT(EPOCH FROM (r.fecha_respuesta - r.created_at)) / 86400
          ) FILTER (WHERE r.estado = 'Respondido' AND r.prioridad = 'Media' AND r.fecha_respuesta IS NOT NULL),
          1
        ) AS promedio_dias_media,
        ROUND(
          AVG(
            EXTRACT(EPOCH FROM (r.fecha_respuesta - r.created_at)) / 86400
          ) FILTER (WHERE r.estado = 'Respondido' AND r.prioridad = 'Baja' AND r.fecha_respuesta IS NOT NULL),
          1
        ) AS promedio_dias_baja
      FROM requerimientos_internos r
      JOIN global_grupos g ON g.id = r.grupo_id
      GROUP BY g.nombre, r.prioridad
      ORDER BY g.nombre, r.prioridad
    `);

    // Pivot por grupo
    const gruposMap = {};
    rows.forEach(row => {
      if (!gruposMap[row.grupo]) {
        gruposMap[row.grupo] = {
          grupo: row.grupo,
          total: 0,
          respondidos: 0,
          promedio_dias: null,
          promedio_dias_alta: null,
          promedio_dias_media: null,
          promedio_dias_baja: null,
        };
      }
      const g = gruposMap[row.grupo];
      g.total += parseInt(row.total) || 0;
      g.respondidos += parseInt(row.respondidos) || 0;
      // Tomar el primer valor no nulo de promedios por prioridad
      if (row.promedio_dias !== null && g.promedio_dias === null) g.promedio_dias = parseFloat(row.promedio_dias);
      if (row.promedio_dias_alta !== null && g.promedio_dias_alta === null) g.promedio_dias_alta = parseFloat(row.promedio_dias_alta);
      if (row.promedio_dias_media !== null && g.promedio_dias_media === null) g.promedio_dias_media = parseFloat(row.promedio_dias_media);
      if (row.promedio_dias_baja !== null && g.promedio_dias_baja === null) g.promedio_dias_baja = parseFloat(row.promedio_dias_baja);
    });

    // Recalcular promedio global por grupo con query separada
    const { rows: globales } = await pool.query(`
      SELECT
        g.nombre AS grupo,
        ROUND(AVG(EXTRACT(EPOCH FROM (r.fecha_respuesta - r.created_at)) / 86400) FILTER (WHERE r.estado = 'Respondido' AND r.fecha_respuesta IS NOT NULL), 1) AS promedio_dias
      FROM requerimientos_internos r
      JOIN global_grupos g ON g.id = r.grupo_id
      GROUP BY g.nombre
    `);

    globales.forEach(row => {
      if (gruposMap[row.grupo]) {
        gruposMap[row.grupo].promedio_dias = row.promedio_dias ? parseFloat(row.promedio_dias) : null;
      }
    });

    res.json(Object.values(gruposMap));
  } catch (error) {
    logger.error('getTiempoRespuestaArea error', { error: error.message });
    res.status(500).json({ error: 'Error al calcular tiempo de respuesta por área.' });
  }
};
