import bcrypt from 'bcrypt';
import pool from '../../../db/database.js';
import crypto from 'crypto';

// ── Usuarios ──────────────────────────────────────────────────────────────────

export const listarUsuarios = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nombre, email, especialidad, is_active AS activo, rol, is_approved FROM global_usuarios'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar usuarios.' });
  }
};

export const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo, is_approved } = req.body;
    await pool.query(
      'UPDATE global_usuarios SET is_active = COALESCE($1, is_active), is_approved = COALESCE($2, is_approved) WHERE id = $3',
      [activo ?? null, is_approved ?? null, id]
    );
    res.json({ message: 'Usuario actualizado.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar usuario.' });
  }
};

export const resetearPassword = async (req, res) => {
  try {
    const { id } = req.params;
    let { newPassword } = req.body;
    if (!newPassword) newPassword = crypto.randomBytes(8).toString('hex');
    const password_hash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE global_usuarios SET password_hash = $1, must_change_password = TRUE WHERE id = $2',
      [password_hash, id]
    );
    res.json({ message: 'Contraseña actualizada.', newPassword });
  } catch (error) {
    res.status(500).json({ error: 'Error al resetear contraseña.' });
  }
};

export const cambiarRol = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol } = req.body;
    await pool.query('UPDATE global_usuarios SET rol = $1 WHERE id = $2', [rol, id]);
    res.json({ message: 'Rol actualizado exitosamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cambiar el rol.' });
  }
};

// ── Áreas / equipos (global_areas_equipos) ────────────────────────────────────

export const listarAreas = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT e.id, e.nombre, e.is_active AS activo, COUNT(gu.id) AS total_miembros
      FROM global_areas_equipos e
      LEFT JOIN global_usuarios gu ON e.id = gu.equipo_id
      WHERE e.is_active = true
      GROUP BY e.id, e.nombre, e.is_active
      ORDER BY e.nombre ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error al listar áreas:', error);
    res.status(500).json({ error: 'Error al listar áreas.' });
  }
};

export const crearArea = async (req, res) => {
  try {
    const { nombre } = req.body;
    await pool.query('INSERT INTO global_areas_equipos (nombre) VALUES ($1)', [nombre]);
    res.status(201).json({ message: 'Área creada correctamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el área.' });
  }
};

export const actualizarArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, activo } = req.body;
    await pool.query(
      'UPDATE global_areas_equipos SET nombre = COALESCE($1, nombre), is_active = COALESCE($2, is_active) WHERE id = $3',
      [nombre, activo, id]
    );
    res.json({ message: 'Área actualizada.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el área.' });
  }
};

export const eliminarArea = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE global_areas_equipos SET is_active = FALSE WHERE id = $1', [id]);
    res.json({ message: 'Área desactivada correctamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al desactivar el área.' });
  }
};
