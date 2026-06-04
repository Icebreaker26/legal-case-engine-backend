import pool from '../../../db/database.js';

export const crearNotificacion = async (usuario_id, mensaje, tipo, referencia_id) => {
    try {
        const query = `
            INSERT INTO notificaciones (usuario_id, mensaje, tipo, referencia_id)
            VALUES ($1, $2, $3, $4)
        `;
        await pool.query(query, [usuario_id, mensaje, tipo, referencia_id]);
    } catch (error) {
        console.error('Error al crear notificación:', error);
    }
};
