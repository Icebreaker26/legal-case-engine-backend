import pool from '../../../db/database.js';

// NOTA: Para realizar esta refactorización total, debemos:
// 1. Crear una tabla de mapeo auxiliar `id_mapping_abogados` para encontrar el UUID del usuario.
// 2. Modificar todas las consultas SQL para buscar por el usuario_uuid (la nueva columna creada en las tablas).

export const registrarAccion = async (req, res) => {
    try {
        const { objetivo_id, comentario, peso } = req.body;
        console.log('DEBUG: Datos recibidos para registrar acción:', { objetivo_id, comentario, peso });
        
        // Asumiendo que req.user.id ya es el UUID del usuario autenticado
        const usuario_uuid = req.user.id; 
        
        const pesoFinal = peso || 1;
        const query = 'INSERT INTO registro_acciones (usuario_uuid, objetivo_id, comentario, peso) VALUES ($1, $2, $3, $4) RETURNING id';
        
        console.log('DEBUG: Ejecutando query SQL:', query, 'con valores:', [usuario_uuid, objetivo_id, comentario, pesoFinal]);
        
        const result = await pool.query(query, [usuario_uuid, objetivo_id, comentario, pesoFinal]);
        res.status(201).json({ id: result.rows[0].id, message: 'Acción registrada correctamente.' });
    } catch (error) {
        console.error('ERROR CRÍTICO al registrar acción:', error);
        res.status(500).json({ error: 'Error al registrar acción.', details: error.message });
    }
};

export const obtenerCumplimientoIndividual = async (req, res) => {
    try {
        const { usuario_uuid } = req.params;
        const query = `
            SELECT o.id, o.titulo, o.descripcion, o.meta_acciones, o.mes, o.anio, o.estado,
            COALESCE(SUM(ra.peso), 0)::int as acciones_realizadas,
            (COALESCE(SUM(ra.peso), 0)::float / NULLIF(o.meta_acciones, 0)) * 100 as porcentaje_cumplimiento 
            FROM objetivos o 
            LEFT JOIN registro_acciones ra ON o.id = ra.objetivo_id 
            WHERE o.usuario_uuid = $1
            GROUP BY o.id, o.titulo, o.descripcion, o.meta_acciones, o.mes, o.anio, o.estado;
        `;
        const { rows } = await pool.query(query, [usuario_uuid]);
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
            SELECT gu.id as usuario_uuid, gu.nombre as profesional,
            (COALESCE(SUM(ra.peso), 0)::float / NULLIF(MAX(o.meta_acciones), 0)) * 100 as cumplimiento 
            FROM global_usuarios gu 
            JOIN objetivos o ON gu.id = o.usuario_uuid 
            LEFT JOIN registro_acciones ra ON o.id = ra.objetivo_id 
            WHERE gu.equipo_id = $1 AND o.estado = 'active'
            GROUP BY gu.id, gu.nombre, o.meta_acciones;
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
            gu.id as usuario_uuid,
            gu.nombre as profesional,
            (COALESCE(SUM(ra.peso), 0)::float / NULLIF(MAX(o.meta_acciones), 0)) * 100 as cumplimiento
            FROM global_usuarios gu
            JOIN objetivos o ON gu.id = o.usuario_uuid
            LEFT JOIN registro_acciones ra ON o.id = ra.objetivo_id
            WHERE gu.equipo_id = $1
            GROUP BY TO_CHAR(ra.fecha_registro, 'YYYY-MM'), gu.id, gu.nombre, o.meta_acciones
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
        const { usuario_uuid, meta_acciones, mes, anio, titulo, descripcion } = req.body;
        const query = 'INSERT INTO objetivos (usuario_uuid, meta_acciones, mes, anio, titulo, descripcion) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id';
        const result = await pool.query(query, [usuario_uuid, meta_acciones, mes, anio, titulo, descripcion]);
        res.status(201).json({ id: result.rows[0].id, message: 'Objetivo creado correctamente.' });
    } catch (error) { res.status(500).json({ error: 'Error al crear objetivo.' }); }
};

export const listarObjetivos = async (req, res) => {
    try {
        const usuario_uuid = req.user.id; // UUID desde el token
        const checkQuery = `SELECT 1 FROM permisos p JOIN modulos m ON p.modulo_id = m.id JOIN acciones a ON p.accion_id = a.id WHERE p.usuario_uuid = $1 AND m.nombre = 'rendimiento' AND a.nombre = 'READ_ALL';`;
        const { rowCount } = await pool.query(checkQuery, [usuario_uuid]);
        
        let query = 'SELECT * FROM objetivos';
        let params = [];
        
        if (rowCount === 0) { query += ' WHERE usuario_uuid = $1'; params = [usuario_uuid]; }
        
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

// ... (métodos de equipo siguen usando global_areas_equipos, no requieren cambios de usuario)

export const asignarUsuarioAEquipo = async (req, res) => {
    try {
        const { equipo_id, usuario_uuid } = req.body;
        
        // Verificar si el usuario ya tiene equipo y obtener el nombre de dicho equipo
        const checkQuery = `
            SELECT gu.equipo_id, e.nombre as equipo_nombre 
            FROM global_usuarios gu 
            LEFT JOIN global_areas_equipos e ON gu.equipo_id = e.id 
            WHERE gu.id = $1
        `;
        const { rows } = await pool.query(checkQuery, [usuario_uuid]);
        
        if (rows.length > 0 && rows[0].equipo_id !== null && String(rows[0].equipo_id) !== String(equipo_id)) {
            const nombreEquipoActual = rows[0].equipo_nombre || 'otro equipo';
            return res.status(400).json({ error: `El usuario ya pertenece a: ${nombreEquipoActual}.` });
        }

        const query = 'UPDATE global_usuarios SET equipo_id = $1 WHERE id = $2';
        await pool.query(query, [equipo_id, usuario_uuid]);
        res.json({ message: 'Usuario asignado al equipo correctamente.' });
    } catch (error) { 
        console.error('Error al asignar usuario:', error);
        res.status(500).json({ error: 'Error al asignar usuario al equipo.' }); 
    }
};

export const removerUsuarioDeEquipo = async (req, res) => {
    try {
        const { usuario_uuid } = req.body;
        
        if (!usuario_uuid) {
            return res.status(400).json({ error: 'usuario_uuid es requerido' });
        }
        
        // 1. Archivar objetivos activos del usuario
        await pool.query(
            'UPDATE objetivos SET "estado" = $1 WHERE "usuario_uuid" = $2 AND "estado" = $3', 
            ['archived', usuario_uuid, 'active']
        );

        // 2. Remover usuario del equipo
        await pool.query('UPDATE global_usuarios SET equipo_id = NULL WHERE id = $1', [usuario_uuid]);
        
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
            SELECT ra.id, ra.comentario, ra.peso, ra.fecha_registro, gu.nombre as profesional
            FROM registro_acciones ra
            JOIN global_usuarios gu ON ra.usuario_uuid = gu.id
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
                gu.id as usuario_uuid,
                gu.nombre as profesional,
                gu.email,
                gu.especialidad,
                gu.rol,
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
            FROM global_areas_equipos e
            JOIN global_usuarios gu ON e.id = gu.equipo_id
            JOIN objetivos o ON gu.id = o.usuario_uuid
            LEFT JOIN registro_acciones ra ON o.id = ra.objetivo_id
            WHERE e.id = $1
            ORDER BY gu.nombre, o.mes, o.anio, ra.fecha_registro DESC;
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
            JOIN global_usuarios gu ON o.usuario_uuid = gu.id
            LEFT JOIN registro_acciones ra ON o.id = ra.objetivo_id
            WHERE gu.equipo_id = $1
            GROUP BY o.id, o.titulo, o.descripcion, o.meta_acciones, o.estado, o.mes, o.anio;
        `;
        const { rows } = await pool.query(query, [equipo_id]);
        res.json(rows);
    } catch (error) { 
        console.error('Error al listar objetivos del equipo:', error);
        res.status(500).json({ error: 'Error al listar objetivos del equipo.' }); 
    }
};
