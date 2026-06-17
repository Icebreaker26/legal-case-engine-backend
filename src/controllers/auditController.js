import pool from '../db/database.js';

export const listarLogs = async (req, res) => {
  try {
    const query = `
      SELECT l.*, gu.nombre as usuario_nombre, t.radicado 
      FROM logs_sistema l 
      LEFT JOIN global_usuarios gu ON l.usuario_uuid = gu.id 
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

export const listarMisLogs = async (req, res) => {
  try {
    const query = `
      SELECT l.*, t.radicado 
      FROM logs_sistema l 
      LEFT JOIN tutelas t ON (l.entidad_afectada = 'tutela' AND l.entidad_id::text = t.id::text)
      WHERE l.usuario_uuid = $1
      ORDER BY l.created_at DESC 
      LIMIT 10
    `;
    const { rows } = await pool.query(query, [req.user.id]);
    res.json(rows);
  } catch (error) {
    console.error('Error al listar mis logs:', error);
    res.status(500).json({ error: 'Error al obtener mis logs.' });
  }
};
