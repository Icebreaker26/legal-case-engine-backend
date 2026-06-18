import pool from '../../../db/database.js';

export const listarRequerimientosPorArea = async (req, res) => {
  try {
    const { area } = req.params;
    // Buscamos el grupo_id primero por el nombre o directamente filtramos por el nombre del grupo
    const { rows } = await pool.query(
      `SELECT r.*, t.radicado as tutela_radicado 
       FROM requerimientos_internos r 
       JOIN tutelas t ON r.tutela_id = t.id 
       JOIN global_grupos g ON r.grupo_id = g.id
       WHERE g.nombre = $1 
       ORDER BY r.created_at DESC`,
      [area]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en listarRequerimientosPorArea:', error);
    res.status(500).json({ error: 'Error al listar requerimientos por área.' });
  }
};
