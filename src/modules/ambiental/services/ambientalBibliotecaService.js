import pool from '../../../db/database.js';
import logger from '../../../utils/logger.js';
import { kmeans } from 'ml-kmeans';

const MIN_EMBEDDINGS = 3;

export const obtenerEstadisticas = async () => {
  const [porTipo, topEntidades, topTerminos, resumen] = await Promise.all([
    pool.query(`
      SELECT
        e.tipo_instrumento,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE a.nivel_riesgo = 'alto')   AS riesgo_alto,
        COUNT(*) FILTER (WHERE a.nivel_riesgo = 'medio')  AS riesgo_medio,
        COUNT(*) FILTER (WHERE a.nivel_riesgo = 'bajo')   AS riesgo_bajo,
        COUNT(*) FILTER (WHERE e.estado = 'cerrado')      AS cerrados,
        ROUND(AVG(
          EXTRACT(DAY FROM (
            CASE WHEN e.estado = 'cerrado' THEN e.updated_at ELSE NOW() END
          ) - e.created_at)
        )::numeric, 0) AS dias_promedio
      FROM expedientes_ambientales e
      LEFT JOIN LATERAL (
        SELECT nivel_riesgo FROM analisis_ambiental
        WHERE expediente_id = e.id ORDER BY created_at DESC LIMIT 1
      ) a ON true
      WHERE e.is_active = true AND e.tipo_instrumento IS NOT NULL
      GROUP BY e.tipo_instrumento
      ORDER BY total DESC
    `),
    pool.query(`
      SELECT
        ent.nombre,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE a.nivel_riesgo = 'alto') AS riesgo_alto,
        COUNT(*) FILTER (WHERE a.nivel_riesgo = 'medio') AS riesgo_medio,
        COUNT(*) FILTER (WHERE a.nivel_riesgo = 'bajo') AS riesgo_bajo
      FROM expedientes_ambientales e
      JOIN global_entidades ent ON ent.id = e.entidad_id
      LEFT JOIN LATERAL (
        SELECT nivel_riesgo FROM analisis_ambiental
        WHERE expediente_id = e.id ORDER BY created_at DESC LIMIT 1
      ) a ON true
      WHERE e.is_active = true
      GROUP BY ent.nombre
      ORDER BY total DESC
      LIMIT 8
    `),
    pool.query(`
      SELECT word, ndoc, nentry
      FROM ts_stat(
        'SELECT search_vector FROM expedientes_ambientales WHERE is_active = true AND search_vector IS NOT NULL'
      )
      WHERE length(word) > 4
        AND word NOT IN ('como','para','este','esta','estos','estas','cuando','donde','desde','hasta','sobre','entre','tiene','tener','debe','siendo','dicha','dicho','dichos','dichas')
        AND word NOT IN (SELECT word FROM biblioteca_terminos_ignorados)
      ORDER BY ndoc DESC, nentry DESC
      LIMIT 24
    `),
    pool.query(`
      SELECT
        COUNT(*) AS total_expedientes,
        COUNT(*) FILTER (WHERE e.is_active = true) AS activos,
        COUNT(ea.id) AS con_embedding,
        COUNT(aa.id) AS con_analisis
      FROM expedientes_ambientales e
      LEFT JOIN embeddings_ambiental ea ON ea.expediente_id = e.id
      LEFT JOIN LATERAL (
        SELECT id FROM analisis_ambiental
        WHERE expediente_id = e.id LIMIT 1
      ) aa ON true
    `),
  ]);

  return {
    resumen: resumen.rows[0],
    por_tipo: porTipo.rows,
    top_entidades: topEntidades.rows,
    top_terminos: topTerminos.rows,
  };
};

export const obtenerClusters = async () => {
  const [meta, clusters, embCount] = await Promise.all([
    pool.query('SELECT * FROM biblioteca_meta WHERE id = 1'),
    pool.query('SELECT * FROM biblioteca_clusters ORDER BY miembros_count DESC'),
    pool.query(`
      SELECT COUNT(*) AS total
      FROM embeddings_ambiental ea
      JOIN expedientes_ambientales e ON e.id = ea.expediente_id
      WHERE e.is_active = true
    `),
  ]);

  const embActuales = parseInt(embCount.rows[0].total);
  const embEnComputo = meta.rows[0]?.embeddings_count_at_compute || 0;

  return {
    clusters: clusters.rows,
    meta: meta.rows[0] || null,
    embeddings_actuales: embActuales,
    needs_recalculate: clusters.rows.length === 0 || (embActuales - embEnComputo) >= 10,
  };
};

export const recalcularClusters = async () => {
  const { rows } = await pool.query(`
    SELECT ea.expediente_id, ea.embedding,
           e.titulo, e.tipo_instrumento, e.estado,
           a.nivel_riesgo, a.resumen
    FROM embeddings_ambiental ea
    JOIN expedientes_ambientales e ON e.id = ea.expediente_id
    LEFT JOIN LATERAL (
      SELECT nivel_riesgo, resumen FROM analisis_ambiental
      WHERE expediente_id = e.id ORDER BY created_at DESC LIMIT 1
    ) a ON true
    WHERE e.is_active = true
  `);

  if (rows.length < MIN_EMBEDDINGS) {
    throw Object.assign(new Error(`Se necesitan al menos ${MIN_EMBEDDINGS} expedientes con embeddings`), { status: 422 });
  }

  const puntos = rows.map(r => ({
    id: r.expediente_id,
    titulo: r.titulo,
    tipo_instrumento: r.tipo_instrumento,
    nivel_riesgo: r.nivel_riesgo,
    resumen: r.resumen,
    vector: JSON.parse(r.embedding),
  }));

  const n = puntos.length;
  const k = n < 6 ? 2 : n < 15 ? 3 : n < 30 ? 5 : 7;

  const vectores = puntos.map(p => p.vector);
  const result = kmeans(vectores, k, { maxIterations: 150, tolerance: 1e-6 });

  // Agrupar miembros por cluster
  const grupos = {};
  result.clusters.forEach((clusterIdx, i) => {
    if (!grupos[clusterIdx]) grupos[clusterIdx] = [];
    grupos[clusterIdx].push(puntos[i]);
  });

  const clusterRows = Object.entries(grupos).map(([idxStr, miembros]) => {
    const idx = parseInt(idxStr);
    const centroide = result.centroids[idx];

    // Medoid: miembro más cercano al centroide
    let minDist = Infinity;
    let medoid = miembros[0];
    miembros.forEach(m => {
      const dist = Math.sqrt(m.vector.reduce((s, v, i) => s + (v - centroide[i]) ** 2, 0));
      if (dist < minDist) { minDist = dist; medoid = m; }
    });

    const tipoDist = {};
    const riesgoDist = {};
    miembros.forEach(m => {
      if (m.tipo_instrumento) tipoDist[m.tipo_instrumento] = (tipoDist[m.tipo_instrumento] || 0) + 1;
      if (m.nivel_riesgo)    riesgoDist[m.nivel_riesgo]   = (riesgoDist[m.nivel_riesgo]   || 0) + 1;
    });

    return {
      cluster_index: idx,
      expediente_id: medoid.id,
      titulo: medoid.titulo,
      resumen: medoid.resumen,
      tipo_instrumento: medoid.tipo_instrumento,
      nivel_riesgo: medoid.nivel_riesgo,
      miembros_count: miembros.length,
      tipo_distribucion: tipoDist,
      riesgo_distribucion: riesgoDist,
      expediente_ids: miembros.map(m => m.id),
    };
  });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM biblioteca_clusters');
    for (const c of clusterRows) {
      await client.query(
        `INSERT INTO biblioteca_clusters
           (cluster_index, expediente_id, titulo, resumen, tipo_instrumento, nivel_riesgo,
            miembros_count, tipo_distribucion, riesgo_distribucion, expediente_ids)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [c.cluster_index, c.expediente_id, c.titulo, c.resumen,
         c.tipo_instrumento, c.nivel_riesgo, c.miembros_count,
         JSON.stringify(c.tipo_distribucion), JSON.stringify(c.riesgo_distribucion),
         c.expediente_ids]
      );
    }
    await client.query(
      `INSERT INTO biblioteca_meta (id, last_computed_at, embeddings_count_at_compute)
       VALUES (1, NOW(), $1)
       ON CONFLICT (id) DO UPDATE SET last_computed_at = NOW(), embeddings_count_at_compute = $1`,
      [n]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  logger.info('biblioteca clusters recalculados', { clusters: clusterRows.length, expedientes: n });
  return { clusters: clusterRows.length, expedientes: n };
};

export const listarTerminosIgnorados = async () => {
  const { rows } = await pool.query(
    `SELECT word, created_at FROM biblioteca_terminos_ignorados ORDER BY created_at DESC`
  );
  return rows;
};

export const ignorarTermino = async (word, usuarioId) => {
  await pool.query(
    `INSERT INTO biblioteca_terminos_ignorados (word, ignorado_por) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [word.toLowerCase().trim(), usuarioId]
  );
};

export const restaurarTermino = async (word) => {
  const { rowCount } = await pool.query(
    `DELETE FROM biblioteca_terminos_ignorados WHERE word = $1`,
    [word.toLowerCase().trim()]
  );
  if (!rowCount) throw Object.assign(new Error('Término no encontrado en la lista de ignorados'), { status: 404 });
};
