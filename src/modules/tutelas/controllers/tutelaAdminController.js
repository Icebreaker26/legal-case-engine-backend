import pool from '../../../db/database.js';

// ── Noise patterns (limpieza de texto PDF) ────────────────────────────────────

export const listarNoisePatterns = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, patron, descripcion, activo FROM noise_patterns ORDER BY id ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar patrones de ruido.' });
  }
};

export const crearNoisePattern = async (req, res) => {
  try {
    const { patron, descripcion } = req.body;
    await pool.query('INSERT INTO noise_patterns (patron, descripcion) VALUES ($1, $2)', [patron, descripcion]);
    res.status(201).json({ message: 'Patrón creado.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear patrón.' });
  }
};

export const actualizarNoisePattern = async (req, res) => {
  try {
    const { id } = req.params;
    const { patron, descripcion, activo } = req.body;
    await pool.query(
      'UPDATE noise_patterns SET patron = COALESCE($1, patron), descripcion = COALESCE($2, descripcion), activo = COALESCE($3, activo) WHERE id = $4',
      [patron, descripcion, activo, id]
    );
    res.json({ message: 'Patrón actualizado.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar patrón.' });
  }
};

export const eliminarNoisePattern = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM noise_patterns WHERE id = $1', [id]);
    res.json({ message: 'Patrón eliminado.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar patrón.' });
  }
};

// ── ROI & métricas ────────────────────────────────────────────────────────────

export const obtenerROI = async (req, res) => {
  try {
    const { rows: cfg } = await pool.query('SELECT * FROM configuracion_roi LIMIT 1');
    const { tiempo_ahorrado_minutos, costo_hora_juridico } = cfg[0] || { tiempo_ahorrado_minutos: 100, costo_hora_juridico: 50.00 };

    const { rows: stats } = await pool.query('SELECT COUNT(*) as total_tutelas FROM tutelas WHERE is_active = TRUE');
    const totalTutelas = parseInt(stats[0].total_tutelas);
    const horasAhorradas = (totalTutelas * tiempo_ahorrado_minutos) / 60;
    const dineroAhorrado = horasAhorradas * parseFloat(costo_hora_juridico);

    res.json({
      totalTutelas,
      horasAhorradas: horasAhorradas.toFixed(2),
      dineroAhorrado: dineroAhorrado.toFixed(2),
      configuracion: { tiempo_ahorrado_minutos, costo_hora_juridico },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al calcular ROI.' });
  }
};

export const actualizarROIConfig = async (req, res) => {
  try {
    const { tiempo_ahorrado_minutos, costo_hora_juridico } = req.body;
    await pool.query(
      'UPDATE configuracion_roi SET tiempo_ahorrado_minutos = $1, costo_hora_juridico = $2 WHERE id = 1',
      [tiempo_ahorrado_minutos, costo_hora_juridico]
    );
    res.json({ message: 'Configuración actualizada.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar ROI.' });
  }
};

export const obtenerCargaTrabajo = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT gu.nombre, COUNT(t.id) AS total_activas
      FROM global_usuarios gu
      LEFT JOIN tutelas t ON gu.id = t.responsable_uuid AND t.estado != 'Finalizada' AND t.is_active = TRUE
      WHERE gu.is_active = TRUE
      GROUP BY gu.nombre
      ORDER BY total_activas DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener carga de trabajo:', error);
    res.status(500).json({ error: 'Error al obtener carga de trabajo.' });
  }
};

export const obtenerLatenciaOperativa = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        DATE_TRUNC('month', t.fecha_recepcion) AS mes,
        AVG(EXTRACT(EPOCH FROM (h.created_at - t.fecha_recepcion)) / 3600) AS horas_promedio
      FROM tutelas t
      INNER JOIN historial_acciones h ON t.id = h.tutela_id
      WHERE h.accion LIKE 'Estado cambiado a: En Proceso%'
      GROUP BY DATE_TRUNC('month', t.fecha_recepcion)
      ORDER BY mes ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error en latencia:', error);
    res.status(500).json({ error: 'Error al obtener latencia.' });
  }
};

// ── Configuración del sistema (exclusiva tutelas) ─────────────────────────────

export const obtenerConfiguracion = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT key, value, description FROM system_config');
    const config = rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener configuración.' });
  }
};

export const actualizarConfiguracion = async (req, res) => {
  try {
    const { key, value } = req.body;
    await pool.query(
      'INSERT INTO system_config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP',
      [key, JSON.stringify(value)]
    );
    res.json({ message: `Configuración ${key} actualizada.` });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar configuración.' });
  }
};

// ── Categorías de derechos ────────────────────────────────────────────────────

export const listarCategorias = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nombre, palabras_clave, is_active FROM global_categorias ORDER BY nombre ASC'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar categorías.' });
  }
};

export const crearCategoria = async (req, res) => {
  try {
    const { nombre, palabras_clave } = req.body;
    await pool.query('INSERT INTO global_categorias (nombre, palabras_clave) VALUES ($1, $2)', [nombre, palabras_clave]);
    res.status(201).json({ message: 'Categoría creada.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear categoría.' });
  }
};

export const actualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, palabras_clave, activo } = req.body;
    await pool.query(
      'UPDATE global_categorias SET nombre = COALESCE($1, nombre), palabras_clave = COALESCE($2, palabras_clave), is_active = COALESCE($3, is_active) WHERE id = $4',
      [nombre, palabras_clave, activo, id]
    );
    res.json({ message: 'Categoría actualizada.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar categoría.' });
  }
};

export const eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE global_categorias SET is_active = FALSE WHERE id = $1', [id]);
    res.json({ message: 'Categoría desactivada.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al desactivar categoría.' });
  }
};
