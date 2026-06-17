import pool from '../../../db/database.js';

export const listarPermisosUsuario = async (req, res) => {
    try {
        const { usuario_uuid } = req.params;
        const query = `
            SELECT m.nombre as modulo, a.nombre as accion
            FROM permisos p
            JOIN modulos m ON p.modulo_id = m.id
            JOIN acciones a ON p.accion_id = a.id
            WHERE p.usuario_uuid = $1;
        `;
        const { rows } = await pool.query(query, [usuario_uuid]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener permisos del usuario.' });
    }
};

export const asignarPermiso = async (req, res) => {
    try {
        const { usuario_uuid, modulo, accion } = req.body;
        
        const query = `
            INSERT INTO permisos (usuario_uuid, modulo_id, accion_id)
            SELECT $1, m.id, a.id
            FROM modulos m, acciones a
            WHERE m.nombre = $2 AND a.nombre = $3
            ON CONFLICT (usuario_uuid, modulo_id, accion_id) DO NOTHING;
        `;
        await pool.query(query, [usuario_uuid, modulo, accion]);
        res.status(201).json({ message: 'Permiso gestionado correctamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al asignar permiso.' });
    }
};

export const asignarPermisosMasivo = async (req, res) => {
    const { usuario_uuid, permisos } = req.body;
    console.log('Asignando permisos masivos:', { usuario_uuid, permisos });
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const p of permisos) {
            const query = `
                INSERT INTO permisos (usuario_uuid, modulo_id, accion_id)
                SELECT $1, m.id, a.id
                FROM modulos m, acciones a
                WHERE m.nombre = $2 AND a.nombre = $3
                ON CONFLICT (usuario_uuid, modulo_id, accion_id) DO NOTHING;
            `;
            const result = await client.query(query, [usuario_uuid, p.modulo, p.accion]);
            console.log(`Permiso procesado (${p.modulo}/${p.accion}):`, result.rowCount);
        }
        await client.query('COMMIT');
        res.status(201).json({ message: 'Permisos asignados masivamente.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error detallado en asignación masiva:', error);
        res.status(500).json({ error: 'Error en asignación masiva.', details: error.message });
    } finally {
        client.release();
    }
};

export const revocarPermiso = async (req, res) => {
    try {
        const { usuario_uuid, modulo, accion } = req.body;
        
        const query = `
            DELETE FROM permisos
            WHERE usuario_uuid = $1 
            AND modulo_id = (SELECT id FROM modulos WHERE nombre = $2)
            AND accion_id = (SELECT id FROM acciones WHERE nombre = $3);
        `;
        await pool.query(query, [usuario_uuid, modulo, accion]);
        res.json({ message: 'Permiso revocado correctamente.' });
    } catch (error) {
        res.status(500).json({ error: 'Error al revocar permiso.' });
    }
};
