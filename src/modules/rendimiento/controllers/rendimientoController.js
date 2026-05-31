import pool from '../../../db/database.js';

export const registrarAccion = async (req, res) => {
    try {
        const { objetivo_id, comentario, peso } = req.body;
        const usuario_id = req.user.id;
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
            SELECT o.id, o.titulo, o.descripcion, o.meta_acciones, o.mes, o.anio, o.estado,
            COALESCE(SUM(ra.peso), 0)::int as acciones_realizadas,
            (COALESCE(SUM(ra.peso), 0)::float / NULLIF(o.meta_acciones, 0)) * 100 as porcentaje_cumplimiento 
            FROM objetivos o 
            LEFT JOIN registro_acciones ra ON o.id = ra.objetivo_id 
            WHERE o.usuario_id = $1
            GROUP BY o.id, o.titulo, o.descripcion, o.meta_acciones, o.mes, o.anio, o.estado;
        `;
        const { rows } = await pool.query(query, [usuario_id]);
        res.json(rows);
    } catch (error) { 
        console.error('Error al obtener cumplimiento individual:', error);
        res.status(500).json({ error: 'Error al obtener cumplimiento individual.' }); 
    }
};

export const obtenerCumplimientoEquipo = async (req, res) => {
    try {
        const { equipo_id } = req.params;
        const query = `
            SELECT ab.id as usuario_id, ab.nombre as profesional,
            (COALESCE(SUM(ra.peso), 0)::float / MAX(o.meta_acciones)) * 100 as cumplimiento 
            FROM abogados ab 
            JOIN objetivos o ON ab.id = o.usuario_id 
            LEFT JOIN registro_acciones ra ON o.id = ra.objetivo_id 
            WHERE ab.equipo_id = $1 AND o.estado = 'active'
            GROUP BY ab.id, ab.nombre, o.meta_acciones;
        `;
        const { rows } = await pool.query(query, [equipo_id]);
        res.json(rows);
    } catch (error) { res.status(500).json({ error: 'Error al obtener cumplimiento de equipo.' }); }
};

export const obtenerHistorialEquipo = async (req, res) => {
    try {
        const { equipo_id } = req.params;
        const query = `
            SELECT TO_CHAR(ra.fecha_registro, 'YYYY-MM') as mes,
            ab.id as usuario_id,
            ab.nombre as profesional,
            (COALESCE(SUM(ra.peso), 0)::float / NULLIF(MAX(o.meta_acciones), 0)) * 100 as cumplimiento
            FROM abogados ab
            JOIN objetivos o ON ab.id = o.usuario_id
            LEFT JOIN registro_acciones ra ON o.id = ra.objetivo_id
            WHERE ab.equipo_id = $1
            GROUP BY TO_CHAR(ra.fecha_registro, 'YYYY-MM'), ab.id, ab.nombre, o.meta_acciones
            ORDER BY mes ASC;
        `;
        const { rows } = await pool.query(query, [equipo_id]);
        res.json(rows);
    } catch (error) { 
        console.error('Error al obtener historial del equipo:', error);
        res.status(500).json({ error: 'Error al obtener historial de equipo.' }); 
    }
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
        const { usuario_id, meta_acciones, mes, anio, titulo, descripcion } = req.body;
        const query = 'INSERT INTO objetivos (usuario_id, meta_acciones, mes, anio, titulo, descripcion) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id';
        const result = await pool.query(query, [usuario_id, meta_acciones, mes, anio, titulo, descripcion]);
        res.status(201).json({ id: result.rows[0].id, message: 'Objetivo creado correctamente.' });
    } catch (error) { res.status(500).json({ error: 'Error al crear objetivo.' }); }
};

export const listarObjetivos = async (req, res) => {
    try {
        const usuario_id = req.user.id;
        const checkQuery = `SELECT 1 FROM permisos p JOIN modulos m ON p.modulo_id = m.id JOIN acciones a ON p.accion_id = a.id WHERE p.usuario_id = $1 AND m.nombre = 'rendimiento' AND a.nombre = 'READ_ALL';`;
        const { rowCount } = await pool.query(checkQuery, [usuario_id]);
        
        let query = 'SELECT * FROM objetivos';
        let params = [];
        
        if (rowCount === 0) { query += ' WHERE usuario_id = $1'; params = [usuario_id]; }
        
        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (error) { res.status(500).json({ error: 'Error al listar objetivos.' }); }
};

export const actualizarObjetivo = async (req, res) => {
    try { const { id } = req.params; const { meta_acciones, mes, anio } = req.body; await pool.query('UPDATE objetivos SET meta_acciones = $1, mes = $2, anio = $3 WHERE id = $4', [meta_acciones, mes, anio, id]); res.json({ message: 'Objetivo actualizado.' }); } catch (error) { res.status(500).json({ error: 'Error al actualizar.' }); }
};

export const eliminarObjetivo = async (req, res) => {
    try { const { id } = req.params; await pool.query('DELETE FROM objetivos WHERE id = $1', [id]); res.json({ message: 'Objetivo eliminado.' }); } catch (error) { res.status(500).json({ error: 'Error al eliminar.' }); }
};

export const crearEquipo = async (req, res) => {
    try {
        const { nombre } = req.body;
        const manager_id = req.user.id;
        const query = 'INSERT INTO equipos (nombre, manager_id) VALUES ($1, $2) RETURNING id';
        const result = await pool.query(query, [nombre, manager_id]);
        res.status(201).json({ id: result.rows[0].id, message: 'Equipo creado correctamente.' });
    } catch (error) { res.status(500).json({ error: 'Error al crear equipo.' }); }
};

export const listarEquiposEliminados = async (req, res) => {
    try { const { rows } = await pool.query('SELECT * FROM equipos WHERE is_active = false'); res.json(rows); } catch (error) { res.status(500).json({ error: 'Error al listar equipos eliminados.' }); }
};

export const restaurarEquipo = async (req, res) => {
    try { const { id } = req.params; await pool.query('UPDATE equipos SET is_active = true WHERE id = $1', [id]); res.json({ message: 'Equipo restaurado.' }); } catch (error) { res.status(500).json({ error: 'Error al restaurar equipo.' }); }
};

export const listarEquipos = async (req, res) => {
    try { 
        const query = `
            SELECT e.*, COUNT(a.id)::int as total_miembros 
            FROM equipos e 
            LEFT JOIN abogados a ON e.id = a.equipo_id 
            WHERE e.is_active = true 
            GROUP BY e.id
        `;
        const { rows } = await pool.query(query); 
        res.json(rows); 
    } catch (error) { res.status(500).json({ error: 'Error al listar equipos.' }); }
};

export const actualizarEquipo = async (req, res) => {
    try { const { id } = req.params; const { nombre, manager_id } = req.body; await pool.query('UPDATE equipos SET nombre = $1, manager_id = $2 WHERE id = $3', [nombre, manager_id, id]); res.json({ message: 'Equipo actualizado.' }); } catch (error) { res.status(500).json({ error: 'Error al actualizar.' }); }
};

export const eliminarEquipo = async (req, res) => {
    try { const { id } = req.params; await pool.query('UPDATE equipos SET is_active = false WHERE id = $1', [id]); res.json({ message: 'Equipo eliminado lógicamente.' }); } catch (error) { res.status(500).json({ error: 'Error al eliminar.' }); }
};

export const asignarUsuarioAEquipo = async (req, res) => {
    try {
        const { equipo_id, usuario_id } = req.body;
        console.log('Intento de asignación:', { equipo_id, usuario_id });
        
        // Verificar si el usuario ya tiene equipo
        const checkQuery = 'SELECT equipo_id FROM abogados WHERE id = $1';
        const { rows } = await pool.query(checkQuery, [usuario_id]);
        console.log('Consulta de equipo actual:', rows);
        
        if (rows.length > 0 && rows[0].equipo_id !== null && Number(rows[0].equipo_id) !== Number(equipo_id)) {
            console.log('Rechazado: El usuario ya pertenece a otro equipo.');
            return res.status(400).json({ error: 'El usuario ya pertenece a otro equipo.' });
        }

        const query = 'UPDATE abogados SET equipo_id = $1 WHERE id = $2';
        await pool.query(query, [equipo_id, usuario_id]);
        res.json({ message: 'Usuario asignado al equipo correctamente.' });
    } catch (error) { 
        console.error('Error al asignar usuario:', error);
        res.status(500).json({ error: 'Error al asignar usuario al equipo.' }); 
    }
};

export const removerUsuarioDeEquipo = async (req, res) => {
    try {
        const { usuario_id } = req.body;
        
        if (!usuario_id) {
            return res.status(400).json({ error: 'usuario_id es requerido' });
        }
        
        // 1. Archivar objetivos activos del usuario
        await pool.query(
            'UPDATE objetivos SET "estado" = $1 WHERE "usuario_id" = $2 AND "estado" = $3', 
            ['archived', usuario_id, 'active']
        );

        // 2. Remover usuario del equipo
        await pool.query('UPDATE abogados SET equipo_id = NULL WHERE id = $1', [usuario_id]);
        
        res.json({ message: 'Usuario removido del equipo y objetivos archivados correctamente.' });
    } catch (error) { 
        console.error('Error al remover usuario del equipo:', error);
        res.status(500).json({ error: 'Error al remover usuario del equipo.', details: error.message }); 
    }
};

export const obtenerCumplimientoGlobal = async (req, res) => {
    try {
        const query = `
            SELECT AVG(cumplimiento) as promedio
            FROM (
                SELECT (COALESCE(SUM(ra.peso), 0)::float / MAX(o.meta_acciones)) * 100 as cumplimiento 
                FROM objetivos o 
                LEFT JOIN registro_acciones ra ON o.id = ra.objetivo_id 
                WHERE o.estado = 'active'
                GROUP BY o.id
            ) as t
        `;
        const { rows } = await pool.query(query);
        const promedio = rows[0].promedio ? Math.round(rows[0].promedio) : 0;
        res.json({ promedio });
    } catch (error) { 
        console.error('Error al obtener cumplimiento global:', error);
        res.status(500).json({ error: 'Error al obtener cumplimiento global.' }); 
    }
};

export const obtenerHistorialAccionesObjetivo = async (req, res) => {
    try {
        const { objetivo_id } = req.params;
        const query = `
            SELECT ra.id, ra.comentario, ra.peso, ra.fecha_registro, ab.nombre as profesional
            FROM registro_acciones ra
            JOIN abogados ab ON ra.usuario_id = ab.id
            WHERE ra.objetivo_id = $1
            ORDER BY ra.fecha_registro DESC;
        `;
        const { rows } = await pool.query(query, [objetivo_id]);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener historial de acciones:', error);
        res.status(500).json({ error: 'Error al obtener historial de acciones.' });
    }
};

export const exportarDatosEquipo = async (req, res) => {
    try {
        const { equipo_id } = req.params;
        const query = `
            SELECT 
                e.nombre as equipo_nombre,
                ab.id as abogado_id,
                ab.nombre as profesional,
                ab.email,
                ab.especialidad,
                ab.rol,
                o.id as objetivo_id,
                o.titulo as objetivo_titulo,
                o.descripcion as objetivo_descripcion,
                o.meta_acciones,
                o.estado as estado_objetivo,
                o.mes,
                o.anio,
                ra.id as accion_id,
                ra.comentario as accion_comentario,
                ra.peso as accion_peso,
                ra.fecha_registro as accion_fecha
            FROM equipos e
            JOIN abogados ab ON e.id = ab.equipo_id
            JOIN objetivos o ON ab.id = o.usuario_id
            LEFT JOIN registro_acciones ra ON o.id = ra.objetivo_id
            WHERE e.id = $1
            ORDER BY ab.nombre, o.mes, o.anio, ra.fecha_registro DESC;
        `;
        const { rows } = await pool.query(query, [equipo_id]);
        res.json(rows);
    } catch (error) {
        console.error('Error al exportar datos completos del equipo:', error);
        res.status(500).json({ error: 'Error al exportar datos completos.' });
    }
};

export const listarObjetivosPorEquipo = async (req, res) => {
    try {
        const { equipo_id } = req.params;
        const query = `
            SELECT o.*, 
            COALESCE(SUM(ra.peso), 0)::int as acciones_realizadas,
            (COALESCE(SUM(ra.peso), 0)::float / NULLIF(o.meta_acciones, 0)) * 100 as porcentaje_cumplimiento
            FROM objetivos o
            JOIN abogados ab ON o.usuario_id = ab.id
            LEFT JOIN registro_acciones ra ON o.id = ra.objetivo_id
            WHERE ab.equipo_id = $1
            GROUP BY o.id, o.titulo, o.descripcion, o.meta_acciones, o.estado, o.mes, o.anio;
        `;
        const { rows } = await pool.query(query, [equipo_id]);
        res.json(rows);
    } catch (error) { 
        console.error('Error al listar objetivos del equipo:', error);
        res.status(500).json({ error: 'Error al listar objetivos del equipo.' }); 
    }
};
