import pool from '../../../db/database.js';

export const listarPermisosUsuario = async (req, res) => {
    try {
        const { usuario_id } = req.params;
        const query = `
            SELECT m.nombre as modulo, a.nombre as accion
            FROM permisos p
            JOIN modulos m ON p.modulo_id = m.id
            JOIN acciones a ON p.accion_id = a.id
            WHERE p.usuario_id = $1;
        `;
        const { rows } = await pool.query(query, [usuario_id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener permisos del usuario.' });
    }
};

export const asignarPermiso = async (req, res) => {
    try {
        const { usuario_id, modulo, accion } = req.body;
        
        const query = `
            INSERT INTO permisos (usuario_id, modulo_id, accion_id)
            SELECT $1, m.id, a.id
            FROM modulos m, acciones a
            WHERE m.nombre = $2 AND a.nombre = $3;
        `;
        await pool.query(query, [usuario_id, modulo, accion]);
        res.status(201).json({ message: 'Permiso asignado correctamente.' });
    } catch (error) {
        // 23505 es el código de error de PostgreSQL para unique_violation
        if (error.code === '23505') {
            return res.status(409).json({ error: 'El permiso ya está asignado a este usuario.' });
        }
        res.status(500).json({ error: 'Error al asignar permiso.' });
    }
};

export const revocarPermiso = async (req, res) => {
    try {
        const { usuario_id, modulo, accion } = req.body;
        
        const query = `
            DELETE FROM permisos
            WHERE usuario_id = $1 
            AND modulo_id = (SELECT id FROM modulos WHERE nombre = $2)
            AND accion_id = (SELECT id FROM acciones WHERE nombre = $3);
        `;
        await pool.query(query, [usuario_id, modulo, accion]);
        res.json({ message: 'Permiso revocado correctamente.' });
    } catch (error) {
        res.status(500).json({ error: 'Error al revocar permiso.' });
    }
};
