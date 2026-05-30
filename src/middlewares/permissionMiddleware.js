import pool from '../db/database.js';

/**
 * Middleware para validar permisos granulares.
 * @param {string} modulo - Nombre del módulo (ej: 'tutelas')
 * @param {string} accion - Acción requerida (ej: 'READ', 'WRITE')
 */
export const checkPermission = (modulo, accion) => {
    return async (req, res, next) => {
        try {
            const usuario_id = req.user?.id;
            if (!usuario_id) return res.status(401).json({ error: 'No autenticado.' });

            // Consulta para verificar si existe el permiso
            console.log('Verificando permiso:', { usuario_id, modulo, accion });
            const query = `
                SELECT 1 
                FROM permisos p
                JOIN modulos m ON p.modulo_id = m.id
                JOIN acciones a ON p.accion_id = a.id
                WHERE p.usuario_id = $1 AND m.nombre = $2 AND a.nombre = $3;
            `;
            
            const result = await pool.query(query, [usuario_id, modulo, accion]);
            console.log('Resultado de consulta de permisos:', result.rowCount);

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
