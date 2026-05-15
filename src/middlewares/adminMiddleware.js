import pool from '../db/database.js';

export const isAdmin = async (req, res, next) => {
  try {
    const { id } = req.user;
    const query = 'SELECT is_admin FROM abogados WHERE id = $1';
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0 || !rows[0].is_admin) {
      return res.status(403).json({ error: 'Acceso denegado. Requiere privilegios de administrador.' });
    }
    next();
  } catch (error) {
    console.error('Error verificando privilegios:', error);
    res.status(500).json({ error: 'Error verificando privilegios.' });
  }
};
