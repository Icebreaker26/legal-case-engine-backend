import pool from '../../../db/database.js';

export const crearNotificacion = async (usuario_uuid, mensaje, tipo, referencia_uuid, modulo = 'tutelas') => {
    try {
        await pool.query(
            `INSERT INTO notificaciones (usuario_uuid, mensaje, tipo, referencia_uuid, modulo)
             VALUES ($1, $2, $3, $4, $5)`,
            [usuario_uuid, mensaje, tipo, referencia_uuid || null, modulo]
        );
    } catch (error) {
        console.error('Error al crear notificación:', error);
    }
};
