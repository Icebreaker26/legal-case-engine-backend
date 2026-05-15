import pool from '../db/database.js';

export const listarLogs = async (req, res) => {
  try {
    const query = `
      SELECT l.*, a.nombre as usuario_nombre, t.radicado 
      FROM logs_sistema l 
      LEFT JOIN abogados a ON l.usuario_id = a.id 
      LEFT JOIN tutelas t ON (l.entidad_afectada = 'tutela' AND l.entidad_id::text = t.id::text)
      ORDER BY l.created_at DESC 
      LIMIT 100
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error al listar logs:', error);
    res.status(500).json({ error: 'Error al obtener los logs.' });
  }
};
