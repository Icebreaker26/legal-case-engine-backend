import pool from '../../../db/database.js';

export const registrarAccion = async (req, res) => {
    try {
        const { objetivo_id, comentario, peso } = req.body;
        const usuario_id = req.user.id;
        // Si no se envía peso, por defecto es 1
        const pesoFinal = peso || 1;
        const query = 'INSERT INTO registro_acciones (usuario_id, objetivo_id, comentario, peso) VALUES ($1, $2, $3, $4) RETURNING id';
        const result = await pool.query(query, [usuario_id, objetivo_id, comentario, pesoFinal]);
        res.status(201).json({ id: result.rows[0].id, message: 'Acción registrada correctamente.' });
    } catch (error) { res.status(500).json({ error: 'Error al registrar acción.' }); }
};

export const obtenerCumplimientoIndividual = async (req, res) => {
    try {
        const { usuario_id } = req.params;
        const query = `
            SELECT o.id, o.meta_acciones, 
            COALESCE(SUM(ra.peso), 0)::int as acciones_realizadas,
            (COALESCE(SUM(ra.peso), 0)::float / o.meta_acciones) * 100 as porcentaje_cumplimiento 
            FROM objetivos o 
            LEFT JOIN registro_acciones ra ON o.id = ra.objetivo_id 
            WHERE o.usuario_id = $1 AND o.estado = 'active'
            GROUP BY o.id;
        `;
        const { rows } = await pool.query(query, [usuario_id]);
        res.json(rows);
    } catch (error) { res.status(500).json({ error: 'Error al obtener cumplimiento individual.' }); }
};

export const obtenerCumplimientoEquipo = async (req, res) => {
    try {
        const { equipo_id } = req.params;
        const query = `
            SELECT ab.nombre as profesional,
            (COALESCE(SUM(ra.peso), 0)::float / o.meta_acciones) * 100 as cumplimiento 
            FROM abogados ab 
            JOIN objetivos o ON ab.id = o.usuario_id 
            LEFT JOIN registro_acciones ra ON o.id = ra.objetivo_id 
            WHERE ab.equipo_id = $1 AND o.estado = 'active'
            GROUP BY ab.nombre, o.meta_acciones;
        `;
        const { rows } = await pool.query(query, [equipo_id]);
        res.json(rows);
    } catch (error) { res.status(500).json({ error: 'Error al obtener cumplimiento de equipo.' }); }
};

export const archivarObjetivo = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE objetivos SET estado = \'archived\' WHERE id = $1', [id]);
        res.json({ message: 'Objetivo archivado correctamente.' });
    } catch (error) { res.status(500).json({ error: 'Error al archivar objetivo.' }); }
};

export const crearObjetivo = async (req, res) => {
    try {
        const { usuario_id, meta_acciones, periodo_inicio, periodo_fin } = req.body;
        const query = 'INSERT INTO objetivos (usuario_id, meta_acciones, periodo_inicio, periodo_fin) VALUES ($1, $2, $3, $4) RETURNING id';
        const result = await pool.query(query, [usuario_id, meta_acciones, periodo_inicio, periodo_fin]);
        res.status(201).json({ id: result.rows[0].id, message: 'Objetivo creado correctamente.' });
    } catch (error) { res.status(500).json({ error: 'Error al crear objetivo.' }); }
};

export const listarObjetivos = async (req, res) => {
    try {
        const usuario_id = req.user.id;
        const checkQuery = `
            SELECT 1 FROM permisos p
            JOIN modulos m ON p.modulo_id = m.id
            JOIN acciones a ON p.accion_id = a.id
            WHERE p.usuario_id = $1 AND m.nombre = 'rendimiento' AND a.nombre = 'READ_ALL';
        `;
        const { rowCount } = await pool.query(checkQuery, [usuario_id]);
        
        let query = 'SELECT * FROM objetivos';
        let params = [];
        
        if (rowCount === 0) {
            query += ' WHERE usuario_id = $1';
            params = [usuario_id];
        }
        
        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error al listar objetivos:', error);
        res.status(500).json({ error: 'Error al listar objetivos.' });
    }
};

export const actualizarObjetivo = async (req, res) => {
    try { const { id } = req.params; const { meta_acciones, periodo_inicio, periodo_fin } = req.body; await pool.query('UPDATE objetivos SET meta_acciones = $1, periodo_inicio = $2, periodo_fin = $3 WHERE id = $4', [meta_acciones, periodo_inicio, periodo_fin, id]); res.json({ message: 'Objetivo actualizado.' }); } catch (error) { res.status(500).json({ error: 'Error al actualizar.' }); }
};

export const eliminarObjetivo = async (req, res) => {
    try { const { id } = req.params; await pool.query('DELETE FROM objetivos WHERE id = $1', [id]); res.json({ message: 'Objetivo eliminado.' }); } catch (error) { res.status(500).json({ error: 'Error al eliminar.' }); }
};

export const crearEquipo = async (req, res) => {
    try {
        const { nombre, manager_id } = req.body;
        const query = 'INSERT INTO equipos (nombre, manager_id) VALUES ($1, $2) RETURNING id';
        const result = await pool.query(query, [nombre, manager_id]);
        res.status(201).json({ id: result.rows[0].id, message: 'Equipo creado correctamente.' });
    } catch (error) { res.status(500).json({ error: 'Error al crear equipo.' }); }
};

export const listarEquipos = async (req, res) => {
    try { const { rows } = await pool.query('SELECT * FROM equipos'); res.json(rows); } catch (error) { res.status(500).json({ error: 'Error al listar equipos.' }); }
};

export const actualizarEquipo = async (req, res) => {
    try { const { id } = req.params; const { nombre, manager_id } = req.body; await pool.query('UPDATE equipos SET nombre = $1, manager_id = $2 WHERE id = $3', [nombre, manager_id, id]); res.json({ message: 'Equipo actualizado.' }); } catch (error) { res.status(500).json({ error: 'Error al actualizar.' }); }
};

export const eliminarEquipo = async (req, res) => {
    try { const { id } = req.params; await pool.query('DELETE FROM equipos WHERE id = $1', [id]); res.json({ message: 'Equipo eliminado.' }); } catch (error) { res.status(500).json({ error: 'Error al eliminar.' }); }
};
