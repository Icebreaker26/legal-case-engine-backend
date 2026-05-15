import bcrypt from 'bcrypt';
import pool from '../db/database.js';

export const listarUsuarios = async (req, res) => {
  try {
    const query = 'SELECT id, nombre, email, especialidad, activo, rol, is_approved FROM abogados';
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar usuarios.' });
  }
};

export const listarAbogadosActivos = async (req, res) => {
  try {
    const query = 'SELECT id, nombre FROM abogados WHERE activo = TRUE AND is_approved = TRUE';
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar abogados.' });
  }
};

export const listarAreas = async (req, res) => {
  try {
    const query = 'SELECT id, nombre, activo FROM areas ORDER BY nombre ASC';
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar áreas.' });
  }
};

export const crearArea = async (req, res) => {
  try {
    const { nombre } = req.body;
    await pool.query('INSERT INTO areas (nombre) VALUES ($1)', [nombre]);
    res.status(201).json({ message: 'Área creada correctamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el área.' });
  }
};

export const actualizarArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, activo } = req.body;
    await pool.query('UPDATE areas SET nombre = COALESCE($1, nombre), activo = COALESCE($2, activo) WHERE id = $3', [nombre, activo, id]);
    res.json({ message: 'Área actualizada.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el área.' });
  }
};

export const eliminarArea = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE areas SET activo = FALSE WHERE id = $1', [id]);
    res.json({ message: 'Área desactivada correctamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al desactivar el área.' });
  }
};

export const listarNoisePatterns = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, patron, descripcion, activo FROM noise_patterns ORDER BY id ASC');
    res.status(200).json(rows);
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
    await pool.query('UPDATE noise_patterns SET patron = COALESCE($1, patron), descripcion = COALESCE($2, descripcion), activo = COALESCE($3, activo) WHERE id = $4', [patron, descripcion, activo, id]);
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

export const obtenerROI = async (req, res) => {
  try {
    const config = await pool.query('SELECT * FROM configuracion_roi LIMIT 1');
    const { tiempo_ahorrado_minutos, costo_hora_juridico } = config.rows[0] || { tiempo_ahorrado_minutos: 100, costo_hora_juridico: 50.00 };
    
    const stats = await pool.query(`
      SELECT COUNT(*) as total_tutelas 
      FROM tutelas 
      WHERE is_active = TRUE
    `);
    
    const totalTutelas = parseInt(stats.rows[0].total_tutelas);
    const horasAhorradas = (totalTutelas * tiempo_ahorrado_minutos) / 60;
    const dineroAhorrado = horasAhorradas * parseFloat(costo_hora_juridico);
    
    res.json({
        totalTutelas,
        horasAhorradas: horasAhorradas.toFixed(2),
        dineroAhorrado: dineroAhorrado.toFixed(2),
        configuracion: { tiempo_ahorrado_minutos, costo_hora_juridico }
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
    const query = `
      SELECT a.nombre, COUNT(t.id) as total_activas
      FROM abogados a
      LEFT JOIN tutelas t ON a.id = t.responsable_id AND t.estado != 'Finalizada' AND t.is_active = TRUE
      WHERE a.activo = TRUE
      GROUP BY a.nombre
      ORDER BY total_activas DESC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener carga de trabajo.' });
  }
};

export const obtenerLatenciaOperativa = async (req, res) => {
  try {
    const query = `
      SELECT 
        DATE_TRUNC('month', t.fecha_recepcion) as mes,
        AVG(EXTRACT(EPOCH FROM (h.created_at - t.fecha_recepcion))/3600) as horas_promedio
      FROM tutelas t
      INNER JOIN historial_acciones h ON t.id = h.tutela_id
      WHERE h.accion LIKE 'Estado cambiado a: En Proceso%'
      GROUP BY DATE_TRUNC('month', t.fecha_recepcion)
      ORDER BY mes ASC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error detallado en latencia:', error);
    res.status(500).json({ error: 'Error al obtener latencia.' });
  }
};

export const cambiarRol = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol } = req.body;
    await pool.query('UPDATE abogados SET rol = $1 WHERE id = $2', [rol, id]);
    res.json({ message: 'Rol actualizado exitosamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cambiar el rol.' });
  }
};

export const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo, is_approved } = req.body;
    
    const query = `
      UPDATE abogados 
      SET 
        activo = COALESCE($1, activo), 
        is_approved = COALESCE($2, is_approved)
      WHERE id = $3
    `;
    await pool.query(query, [activo, is_approved, id]);
    res.json({ message: 'Usuario actualizado.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar usuario.' });
  }
};

export const resetearPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);
    
    const query = 'UPDATE abogados SET password_hash = $1 WHERE id = $2';
    await pool.query(query, [password_hash, id]);
    
    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al resetear contraseña.' });
  }
};

export const listarCategorias = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, nombre, palabras_clave, activo FROM categorias_juridicas ORDER BY nombre ASC');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar categorías.' });
  }
};

export const crearCategoria = async (req, res) => {
  try {
    const { nombre, palabras_clave } = req.body;
    await pool.query('INSERT INTO categorias_juridicas (nombre, palabras_clave) VALUES ($1, $2)', [nombre, palabras_clave]);
    res.status(201).json({ message: 'Categoría creada.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear categoría.' });
  }
};

export const actualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, palabras_clave, activo } = req.body;
    await pool.query('UPDATE categorias_juridicas SET nombre = COALESCE($1, nombre), palabras_clave = COALESCE($2, palabras_clave), activo = COALESCE($3, activo) WHERE id = $4', [nombre, palabras_clave, activo, id]);
    res.json({ message: 'Categoría actualizada.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar categoría.' });
  }
};

export const eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE categorias_juridicas SET activo = FALSE WHERE id = $1', [id]);
    res.json({ message: 'Categoría desactivada.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al desactivar categoría.' });
  }
};
