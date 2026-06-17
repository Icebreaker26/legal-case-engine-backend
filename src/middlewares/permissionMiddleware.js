import pool from '../db/database.js';

/**
 * Middleware para validar permisos granulares.
 * @param {string} modulo - Nombre del módulo (ej: 'tutelas')
 * @param {string} accion - Acción requerida (ej: 'READ', 'WRITE')
 */
export const checkPermission = (modulo, accion) => {
    return async (req, res, next) => {
        try {
            const usuario_uuid = req.user?.id;
            if (!usuario_uuid) return res.status(401).json({ error: 'No autenticado.' });

            // 1. Verificar si el usuario es administrador
            const adminCheck = await pool.query('SELECT is_admin FROM global_usuarios WHERE id = $1', [usuario_uuid]);
            if (adminCheck.rows[0]?.is_admin) {
                return next();
            }

            // 2. Consulta para verificar si existe el permiso granular
            const query = `
                SELECT 1 
                FROM permisos p
                JOIN modulos m ON p.modulo_id = m.id
                JOIN acciones a ON p.accion_id = a.id
                WHERE p.usuario_uuid = $1 AND m.nombre = $2 AND a.nombre = $3;
            `;
            
            const result = await pool.query(query, [usuario_uuid, modulo, accion]);

            if (result.rowCount === 0) {
                return res.status(403).json({ error: `Acceso denegado: requieres permiso ${accion} en módulo ${modulo}.` });
            }

            next();
        } catch (error) {
            console.error('Error al verificar permisos:', error);
            res.status(500).json({ error: 'Error interno de autorización.' });
        }
    };
};
