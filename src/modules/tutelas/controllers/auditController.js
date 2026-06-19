import pool from '../../../db/database.js';

export const listarLogs = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, Math.max(10, parseInt(req.query.limit) || 25));
    const offset = (page - 1) * limit;
    const search = req.query.search?.trim() || '';
    const accion = req.query.accion?.trim() || '';

    const conditions = [];
    const values = [];

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`(gu.nombre ILIKE $${values.length} OR l.accion ILIKE $${values.length})`);
    }
    if (accion) {
      values.push(accion);
      conditions.push(`l.accion = $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [{ rows }, { rows: total }] = await Promise.all([
      pool.query(
        `SELECT l.*, gu.nombre AS usuario_nombre, t.radicado
         FROM logs_sistema l
         LEFT JOIN global_usuarios gu ON l.usuario_uuid = gu.id
         LEFT JOIN tutelas t ON (l.entidad_afectada = 'tutela' AND l.entidad_id::text = t.id::text)
         ${where}
         ORDER BY l.created_at DESC
         LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        [...values, limit, offset]
      ),
      pool.query(
        `SELECT COUNT(*) AS total
         FROM logs_sistema l
         LEFT JOIN global_usuarios gu ON l.usuario_uuid = gu.id
         ${where}`,
        values
      ),
    ]);

    const { rows: acciones } = await pool.query(
      `SELECT DISTINCT accion FROM logs_sistema ORDER BY accion`
    );

    res.json({
      data:     rows,
      total:    parseInt(total[0].total),
      page,
      limit,
      pages:    Math.ceil(parseInt(total[0].total) / limit),
      acciones: acciones.map(r => r.accion),
    });
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
