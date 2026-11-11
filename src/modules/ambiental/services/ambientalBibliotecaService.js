import pool from '../../../db/database.js';
import logger from '../../../utils/logger.js';
import { kmeans } from 'ml-kmeans';
import { PCA } from 'ml-pca';
import { env } from '../../../config/env.js';
import { resolverMotorSimilares, MODELO_ALPHA_AMBIENTAL } from './ambientalEmbeddingService.js';

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

// ── Agrupación semántica (k-means + PCA) ─────────────────────────────────────
//
// #198 (épica #199):
// - Semilla fija para la inicialización k-means++: con los mismos vectores,
//   dos recálculos dan la misma partición (antes era aleatoria).
// - Vectores: si la guarda de similares (#196) se cumple — e5 y
//   chunks_ambiental completo —, un vector por expediente = promedio de sus
//   trozos activos (contenido y análisis), normalizado a norma 1. El promedio
//   cubre el documento completo (embeddings_ambiental solo cubría los
//   primeros 1.500 caracteres) y, normalizado, deja la distancia euclídea de
//   k-means en correspondencia con el coseno. Si la guarda no se cumple, se
//   sigue usando embeddings_ambiental, como antes.
// - La meta guarda el modelo y la fuente de los vectores del último cálculo:
//   si cambian, `needs_recalculate` lo avisa aunque los conteos no cambien.
// - La meta guarda también la silueta media del k elegido (diagnóstico; la
//   regla de k no cambia).

export const KMEANS_SEED = 198;
export const KMEANS_OPCIONES = Object.freeze({ maxIterations: 150, tolerance: 1e-6, seed: KMEANS_SEED });
export const FUENTE_TROZOS = 'chunks_ambiental';
export const FUENTE_LEGADA = 'embeddings_ambiental';

const normalizar = (v) => {
  const norma = Math.hypot(...v);
  return norma > 0 ? v.map((x) => x / norma) : v;
};

const distancia = (a, b) => Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));

/** Regla de k (sin cambios). */
export const elegirK = (n) => (n < 6 ? 2 : n < 15 ? 3 : n < 30 ? 5 : 7);

/** Silueta media (distancia euclídea), o null si no está definida. */
export const siluetaMedia = (vectores, asignaciones) => {
  const n = vectores.length;
  const grupos = new Set(asignaciones);
  if (grupos.size < 2 || n <= grupos.size) return null;
  let suma = 0;
  for (let i = 0; i < n; i++) {
    const porGrupo = new Map();
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const g = asignaciones[j];
      const acc = porGrupo.get(g) ?? { suma: 0, n: 0 };
      acc.suma += distancia(vectores[i], vectores[j]);
      acc.n += 1;
      porGrupo.set(g, acc);
    }
    const propio = porGrupo.get(asignaciones[i]);
    if (!propio) continue; // grupo de un solo miembro: s(i) = 0
    const a = propio.suma / propio.n;
    let b = Infinity;
    for (const [g, acc] of porGrupo) if (g !== asignaciones[i]) b = Math.min(b, acc.suma / acc.n);
    suma += (b - a) / Math.max(a, b);
  }
  return suma / n;
};

/**
 * Cálculo puro (sin base de datos): k-means con semilla, medoides,
 * distribuciones y proyección PCA 2D normalizada a [0, 1].
 */
export const calcularBiblioteca = (puntos) => {
  const n = puntos.length;
  const k = elegirK(n);
  const vectores = puntos.map((p) => p.vector);
  const result = kmeans(vectores, k, KMEANS_OPCIONES);

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
      const dist = distancia(m.vector, centroide);
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

  // PCA 2D — proyección de todos los puntos
  const pca = new PCA(vectores);
  const coords2D = pca.predict(vectores, { nComponents: 2 }).to2DArray();

  // Normalizar a [0, 1] para facilitar el render en el frontend
  const xs = coords2D.map(p => p[0]);
  const ys = coords2D.map(p => p[1]);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const norm = (v, min, max) => max === min ? 0.5 : (v - min) / (max - min);

  const puntos2D = puntos.map((p, i) => ({
    expediente_id:   p.id,
    titulo:          p.titulo,
    tipo_instrumento: p.tipo_instrumento,
    nivel_riesgo:    p.nivel_riesgo,
    cluster_index:   result.clusters[i],
    x:               norm(coords2D[i][0], xMin, xMax),
    y:               norm(coords2D[i][1], yMin, yMax),
  }));

  return { k, asignaciones: result.clusters, clusterRows, puntos2D, silueta: siluetaMedia(vectores, result.clusters) };
};

/**
 * Fuente y modelo de los vectores que usaría hoy la biblioteca (sin leerlos).
 * La fuente nueva exige la misma guarda que la búsqueda de similares (#196).
 */
export const fuenteVectoresActual = async (db = pool) => {
  const motor = await resolverMotorSimilares(db, { avisar: false });
  return motor === 'alpha'
    ? { fuente: FUENTE_TROZOS, modelo: MODELO_ALPHA_AMBIENTAL }
    // embeddings_ambiental no registra el modelo por fila: es el de EMBEDDING_MODEL.
    : { fuente: FUENTE_LEGADA, modelo: env.EMBEDDING_MODEL };
};

const SQL_METADATOS = `
    JOIN expedientes_ambientales e ON e.id = v.expediente_id
    LEFT JOIN LATERAL (
      SELECT nivel_riesgo, resumen FROM analisis_ambiental
      WHERE expediente_id = e.id ORDER BY created_at DESC LIMIT 1
    ) a ON true
    WHERE e.is_active = true
    ORDER BY v.expediente_id`;

/** Un vector por expediente activo, de la fuente indicada. */
export const leerVectoresBiblioteca = async (fuente, db = pool) => {
  const { rows } = fuente === FUENTE_TROZOS
    ? await db.query(`
        SELECT v.expediente_id, v.embedding::text AS embedding,
               e.titulo, e.tipo_instrumento, e.estado, a.nivel_riesgo, a.resumen
        FROM (
          SELECT expediente_id, AVG(embedding) AS embedding
          FROM chunks_ambiental WHERE is_active = TRUE
          GROUP BY expediente_id
        ) v ${SQL_METADATOS}`)
    : await db.query(`
        SELECT v.expediente_id, v.embedding::text AS embedding,
               e.titulo, e.tipo_instrumento, e.estado, a.nivel_riesgo, a.resumen
        FROM embeddings_ambiental v ${SQL_METADATOS}`);

  return rows.map((r) => ({
    id: r.expediente_id,
    titulo: r.titulo,
    tipo_instrumento: r.tipo_instrumento,
    nivel_riesgo: r.nivel_riesgo,
    resumen: r.resumen,
    vector: fuente === FUENTE_TROZOS ? normalizar(JSON.parse(r.embedding)) : JSON.parse(r.embedding),
  }));
};

const contarVectores = async (fuente, db) => {
  const { rows } = fuente === FUENTE_TROZOS
    ? await db.query(`
        SELECT COUNT(DISTINCT c.expediente_id) AS total
        FROM chunks_ambiental c
        JOIN expedientes_ambientales e ON e.id = c.expediente_id
        WHERE c.is_active = TRUE AND e.is_active = TRUE`)
    : await db.query(`
        SELECT COUNT(*) AS total
        FROM embeddings_ambiental ea
        JOIN expedientes_ambientales e ON e.id = ea.expediente_id
        WHERE e.is_active = true`);
  return parseInt(rows[0].total);
};

export const obtenerClusters = async (db = pool) => {
  const actual = await fuenteVectoresActual(db);
  const [meta, clusters, embActuales, puntosCount] = await Promise.all([
    db.query('SELECT * FROM biblioteca_meta WHERE id = 1'),
    db.query('SELECT * FROM biblioteca_clusters ORDER BY miembros_count DESC'),
    contarVectores(actual.fuente, db),
    db.query('SELECT COUNT(*) AS total FROM biblioteca_puntos'),
  ]);

  const m = meta.rows[0] || null;
  const embEnComputo = m?.embeddings_count_at_compute || 0;
  const sinProyeccion = parseInt(puntosCount.rows[0].total) === 0 && clusters.rows.length > 0;
  // Un cálculo anterior a #198 no registró modelo ni fuente: se trata como
  // desactualizado, porque no hay forma de saber con qué vectores se hizo.
  const otrosVectores = clusters.rows.length > 0
    && (m?.modelo_at_compute !== actual.modelo || m?.fuente_at_compute !== actual.fuente);

  return {
    clusters: clusters.rows,
    meta: m,
    embeddings_actuales: embActuales,
    needs_recalculate: clusters.rows.length === 0 || sinProyeccion || otrosVectores || (embActuales - embEnComputo) >= 10,
  };
};

/**
 * Recalcula la biblioteca. Con `db` = pool abre su propia transacción; si se
 * le pasa un cliente, escribe dentro de la transacción de quien llama.
 */
export const recalcularClusters = async (db = pool) => {
  const { fuente, modelo } = await fuenteVectoresActual(db);
  const puntos = await leerVectoresBiblioteca(fuente, db);

  if (puntos.length < MIN_EMBEDDINGS) {
    throw Object.assign(new Error(`Se necesitan al menos ${MIN_EMBEDDINGS} expedientes con embeddings`), { status: 422 });
  }

  const n = puntos.length;
  const { clusterRows, puntos2D, silueta } = calcularBiblioteca(puntos);

  const propio = typeof db.release !== 'function';
  const client = propio ? await pool.connect() : db;
  try {
    if (propio) await client.query('BEGIN');
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
    await client.query('DELETE FROM biblioteca_puntos');
    for (const p of puntos2D) {
      await client.query(
        `INSERT INTO biblioteca_puntos
           (expediente_id, titulo, tipo_instrumento, nivel_riesgo, cluster_index, x, y)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [p.expediente_id, p.titulo, p.tipo_instrumento, p.nivel_riesgo, p.cluster_index, p.x, p.y]
      );
    }
    await client.query(
      `INSERT INTO biblioteca_meta (id, last_computed_at, embeddings_count_at_compute, modelo_at_compute, fuente_at_compute, silueta)
       VALUES (1, NOW(), $1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET last_computed_at = NOW(), embeddings_count_at_compute = $1,
         modelo_at_compute = $2, fuente_at_compute = $3, silueta = $4`,
      [n, modelo, fuente, silueta == null ? null : Number(silueta.toFixed(4))]
    );
    if (propio) await client.query('COMMIT');
  } catch (err) {
    if (propio) await client.query('ROLLBACK');
    throw err;
  } finally {
    if (propio) client.release();
  }

  logger.info('biblioteca clusters recalculados', { clusters: clusterRows.length, expedientes: n, fuente, modelo, silueta });
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

export const obtenerNormasRecurrentes = async ({ tipo_instrumento } = {}) => {
  const values = [];
  const filtroTipo = tipo_instrumento
    ? `AND e.tipo_instrumento = $${values.push(tipo_instrumento)}`
    : '';

  const { rows } = await pool.query(`
    SELECT
      n.instrumento,
      n.articulo,
      COUNT(*)                                                   AS frecuencia,
      COUNT(*) FILTER (WHERE a.nivel_riesgo = 'alto')            AS riesgo_alto,
      COUNT(*) FILTER (WHERE a.nivel_riesgo = 'medio')           AS riesgo_medio,
      COUNT(*) FILTER (WHERE a.nivel_riesgo = 'bajo')            AS riesgo_bajo,
      array_agg(DISTINCT e.tipo_instrumento)
        FILTER (WHERE e.tipo_instrumento IS NOT NULL)            AS tipos_instrumento,
      mode() WITHIN GROUP (ORDER BY n.descripcion)
        FILTER (WHERE n.descripcion IS NOT NULL AND n.descripcion <> '') AS descripcion
    FROM normas_citadas_ambiental n
    JOIN analisis_ambiental aa ON aa.id = n.analisis_id
    JOIN expedientes_ambientales e ON e.id = aa.expediente_id
    LEFT JOIN LATERAL (
      SELECT nivel_riesgo FROM analisis_ambiental
      WHERE expediente_id = e.id ORDER BY created_at DESC LIMIT 1
    ) a ON true
    WHERE e.is_active = true
      AND n.instrumento IS NOT NULL
      ${filtroTipo}
    GROUP BY n.instrumento, n.articulo
    ORDER BY frecuencia DESC, n.instrumento
    LIMIT 60
  `, values);

  // Agrupar por instrumento para el frontend
  const porInstrumento = {};
  for (const row of rows) {
    if (!porInstrumento[row.instrumento]) {
      porInstrumento[row.instrumento] = { instrumento: row.instrumento, articulos: [], total: 0 };
    }
    const g = porInstrumento[row.instrumento];
    g.total += parseInt(row.frecuencia);
    if (row.articulo) {
      g.articulos.push({
        articulo:          row.articulo,
        descripcion:       row.descripcion || null,
        frecuencia:        parseInt(row.frecuencia),
        riesgo_alto:       parseInt(row.riesgo_alto  || 0),
        riesgo_medio:      parseInt(row.riesgo_medio || 0),
        riesgo_bajo:       parseInt(row.riesgo_bajo  || 0),
        tipos_instrumento: row.tipos_instrumento || [],
      });
    }
  }

  return Object.values(porInstrumento).sort((a, b) => b.total - a.total);
};

export const obtenerProyeccion = async () => {
  const { rows } = await pool.query(
    `SELECT expediente_id, titulo, tipo_instrumento, nivel_riesgo, cluster_index, x, y
     FROM biblioteca_puntos
     ORDER BY cluster_index, id`
  );
  return rows;
};
