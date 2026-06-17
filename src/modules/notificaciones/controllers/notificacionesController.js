import pool from '../../../db/database.js';

export const listarNotificaciones = async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM notificaciones WHERE usuario_uuid = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(rows);
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al listar notificaciones.' }); }
};

export const marcarComoLeida = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE notificaciones SET leida = true WHERE id = $1 AND usuario_uuid = $2', [id, req.user.id]);
        res.status(200).json({ message: 'Notificación marcada como leída.' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al actualizar.' }); }
};
