import pool from '../../../db/database.js';

export const listarProyectos = async (req, res) => {
    try { const { rows } = await pool.query('SELECT * FROM global_proyectos WHERE is_active = true ORDER BY nombre ASC'); res.json(rows); } catch (error) { res.status(500).json({ error: 'Error al listar proyectos.' }); }
};
export const crearProyecto = async (req, res) => {
    try { const { nombre } = req.body; await pool.query('INSERT INTO global_proyectos (nombre) VALUES ($1)', [nombre]); res.status(201).json({ message: 'Proyecto creado.' }); } catch (error) { res.status(500).json({ error: 'Error al crear proyecto.' }); }
};
export const actualizarProyecto = async (req, res) => {
    try { const { id } = req.params; const { nombre } = req.body; await pool.query('UPDATE global_proyectos SET nombre = $1 WHERE id = $2', [nombre, id]); res.json({ message: 'Proyecto actualizado.' }); } catch (error) { res.status(500).json({ error: 'Error al actualizar proyecto.' }); }
};
export const eliminarProyecto = async (req, res) => {
    try { const { id } = req.params; await pool.query('UPDATE global_proyectos SET is_active = false WHERE id = $1', [id]); res.json({ message: 'Proyecto archivado.' }); } catch (error) { res.status(500).json({ error: 'Error al archivar proyecto.' }); }
};

export const listarContratos = async (req, res) => {
    try { const { rows } = await pool.query('SELECT * FROM global_contratos WHERE is_active = true ORDER BY numero ASC'); res.json(rows); } catch (error) { res.status(500).json({ error: 'Error al listar contratos.' }); }
};
export const crearContrato = async (req, res) => {
    try { const { numero } = req.body; await pool.query('INSERT INTO global_contratos (numero) VALUES ($1)', [numero]); res.status(201).json({ message: 'Contrato creado.' }); } catch (error) { res.status(500).json({ error: 'Error al crear contrato.' }); }
};
export const actualizarContrato = async (req, res) => {
    try { const { id } = req.params; const { numero } = req.body; await pool.query('UPDATE global_contratos SET numero = $1 WHERE id = $2', [numero, id]); res.json({ message: 'Contrato actualizado.' }); } catch (error) { res.status(500).json({ error: 'Error al actualizar contrato.' }); }
};
export const eliminarContrato = async (req, res) => {
    try { const { id } = req.params; await pool.query('UPDATE global_contratos SET is_active = false WHERE id = $1', [id]); res.json({ message: 'Contrato archivado.' }); } catch (error) { res.status(500).json({ error: 'Error al archivar contrato.' }); }
};

export const listarEntidades = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM global_entidades WHERE is_active = true ORDER BY nombre ASC');
        res.json(rows);
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al listar entidades.' }); }
};

export const listarInactivosEntidades = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM global_entidades WHERE is_active = false ORDER BY nombre ASC');
        res.json(rows);
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al listar entidades inactivas.' }); }
};

export const crearEntidad = async (req, res) => {
    try {
        const { nombre } = req.body;
        await pool.query('INSERT INTO global_entidades (nombre) VALUES ($1)', [nombre]);
        res.status(201).json({ message: 'Entidad creada.' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al crear entidad.' }); }
};

export const actualizarEntidad = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre } = req.body;
        await pool.query('UPDATE global_entidades SET nombre = $1 WHERE id = $2', [nombre, id]);
        res.json({ message: 'Entidad actualizada.' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al actualizar entidad.' }); }
};

export const eliminarEntidad = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE global_entidades SET is_active = false WHERE id = $1', [id]);
        res.json({ message: 'Entidad archivada.' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al archivar entidad.' }); }
};

export const recuperarEntidad = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE global_entidades SET is_active = true WHERE id = $1', [id]);
        res.json({ message: 'Entidad recuperada.' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al recuperar entidad.' }); }
};

export const listarEstados = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM conformidad_estados WHERE is_active = true ORDER BY orden ASC');
        res.json(rows);
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al listar estados.' }); }
};

export const crearEstado = async (req, res) => {
    try {
        const { nombre, orden } = req.body;
        await pool.query('INSERT INTO conformidad_estados (nombre, orden) VALUES ($1, $2)', [nombre, orden]);
        res.status(201).json({ message: 'Estado creado.' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al crear estado.' }); }
};

export const actualizarEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, orden } = req.body;
        await pool.query('UPDATE conformidad_estados SET nombre = $1, orden = $2 WHERE id = $3', [nombre, orden, id]);
        res.json({ message: 'Estado actualizado.' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al actualizar estado.' }); }
};

export const eliminarEstado = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE conformidad_estados SET is_active = false WHERE id = $1', [id]);
        res.json({ message: 'Estado archivado.' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al archivar estado.' }); }
};

export const recuperarEstado = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE conformidad_estados SET is_active = true WHERE id = $1', [id]);
        res.json({ message: 'Estado recuperado.' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al recuperar estado.' }); }
};

export const crearConformidad = async (req, res) => {
    try {
        const { concepto, entidad_id, proyecto_id, contrato_id, responsable_uuid, solicitante_uuid, fecha_recepcion, fecha_solicitud, ot, wbe, valor, link_acta, soportes_link } = req.body;
        const query = `
            INSERT INTO conformidades (concepto, entidad_id, proyecto_id, contrato_id, responsable_uuid, solicitante_uuid, fecha_recepcion, fecha_solicitud, ot, wbe, valor, link_acta, estado, soportes_link) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'SOLICITADO', $13) 
            RETURNING id
        `;
        const result = await pool.query(query, [concepto, entidad_id, proyecto_id, contrato_id, responsable_uuid, solicitante_uuid, fecha_recepcion, fecha_solicitud, ot, wbe, valor, link_acta, soportes_link]);
        
        await pool.query('INSERT INTO conformidad_trazabilidad (conformidad_id, usuario_uuid, estado_nuevo, comentario) VALUES ($1, $2, $3, $4)', 
            [result.rows[0].id, req.user.id, 'SOLICITADO', 'Conformidad creada.']);

        res.status(201).json({ id: result.rows[0].id, message: 'Conformidad creada.' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al crear conformidad.' }); }
};

export const listarConformidades = async (req, res) => {
    try {
        const query = `
            SELECT c.*, gu.nombre as solicitante_nombre, ge.nombre as entidad_nombre, gp.nombre as proyecto_nombre, gc.numero as contrato_nombre, gr.nombre as responsable_nombre,
            ARRAY_AGG(DISTINCT gg.nombre) FILTER (WHERE gg.nombre IS NOT NULL) as grupos
            FROM conformidades c
            LEFT JOIN global_usuarios gu ON c.solicitante_uuid = gu.id
            LEFT JOIN global_entidades ge ON c.entidad_id = ge.id
            LEFT JOIN global_proyectos gp ON c.proyecto_id = gp.id
            LEFT JOIN global_contratos gc ON c.contrato_id = gc.id
            LEFT JOIN global_usuarios gr ON c.responsable_uuid = gr.id
            LEFT JOIN conformidad_grupos cg ON c.id = cg.conformidad_id
            LEFT JOIN global_grupos gg ON cg.grupo_id = gg.id
            GROUP BY c.id, gu.nombre, ge.nombre, gp.nombre, gc.numero, gr.nombre
            ORDER BY c.created_at DESC
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al listar conformidades.' }); }
};

export const listarMisConformidades = async (req, res) => {
    try {
        const query = `
            SELECT c.*, gu.nombre as solicitante_nombre, ge.nombre as entidad_nombre, gp.nombre as proyecto_nombre, gc.numero as contrato_nombre, gr.nombre as responsable_nombre,
            ARRAY_AGG(DISTINCT gg.nombre) FILTER (WHERE gg.nombre IS NOT NULL) as grupos
            FROM conformidades c
            LEFT JOIN global_usuarios gu ON c.solicitante_uuid = gu.id
            LEFT JOIN global_entidades ge ON c.entidad_id = ge.id
            LEFT JOIN global_proyectos gp ON c.proyecto_id = gp.id
            LEFT JOIN global_contratos gc ON c.contrato_id = gc.id
            LEFT JOIN global_usuarios gr ON c.responsable_uuid = gr.id
            LEFT JOIN conformidad_grupos cg ON c.id = cg.conformidad_id
            LEFT JOIN global_grupos gg ON cg.grupo_id = gg.id
            WHERE c.solicitante_uuid = $1 OR c.responsable_uuid = $1
            GROUP BY c.id, gu.nombre, ge.nombre, gp.nombre, gc.numero, gr.nombre
            ORDER BY c.created_at DESC
        `;
        const { rows } = await pool.query(query, [req.user.id]);
        res.json(rows);
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al listar mis conformidades.' }); }
};

export const listarGrupos = async (req, res) => {
    try { const { rows } = await pool.query('SELECT * FROM global_grupos WHERE is_active = true ORDER BY nombre ASC'); res.json(rows); } catch (error) { console.error(error); res.status(500).json({ error: 'Error al listar grupos.' }); }
};

export const asignarGrupoAConformidad = async (req, res) => {
    try { const { id } = req.params; const { grupo_id } = req.body; await pool.query('INSERT INTO conformidad_grupos (conformidad_id, grupo_id) VALUES ($1, $2)', [id, grupo_id]); res.status(201).json({ message: 'Grupo asignado.' }); } catch (error) { console.error(error); res.status(500).json({ error: 'Error al asignar grupo.' }); }
};

export const eliminarGrupoDeConformidad = async (req, res) => {
    try { const { id, grupo_id } = req.params; await pool.query('DELETE FROM conformidad_grupos WHERE conformidad_id = $1 AND grupo_id = $2', [id, grupo_id]); res.json({ message: 'Grupo removido.' }); } catch (error) { console.error(error); res.status(500).json({ error: 'Error al remover grupo.' }); }
};

export const actualizarEstadoConformidad = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, comentario, soportes_link, link_acta, hoja_contable_normal, hoja_contable_reembolsable, numero_conformidad } = req.body;
        const usuario_uuid = req.user.id;

        const old = await pool.query('SELECT * FROM conformidades WHERE id = $1', [id]);
        
        const isActive = estado !== 'CONFORMADO';
        
        let updateQuery = 'UPDATE conformidades SET estado = $1, is_active = $2';
        let params = [estado, isActive, id];
        
        if (soportes_link) { updateQuery += ', soportes_link = $' + (params.length + 1); params.push(soportes_link); }
        if (link_acta) { updateQuery += ', link_acta = $' + (params.length + 1); params.push(link_acta); }
        if (hoja_contable_normal) { updateQuery += ', hoja_contable_normal = $' + (params.length + 1); params.push(hoja_contable_normal); }
        if (hoja_contable_reembolsable) { updateQuery += ', hoja_contable_reembolsable = $' + (params.length + 1); params.push(hoja_contable_reembolsable); }
        if (numero_conformidad) { updateQuery += ', numero_conformidad = $' + (params.length + 1); params.push(numero_conformidad); }
        
        updateQuery += ' WHERE id = $3';
        await pool.query(updateQuery, params);
        
        await pool.query('INSERT INTO conformidad_trazabilidad (conformidad_id, usuario_uuid, estado_anterior, estado_nuevo, comentario) VALUES ($1, $2, $3, $4, $5)', 
            [id, usuario_uuid, req.body.estado_anterior, estado, comentario]);

        res.json({ message: 'Estado actualizado.' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al actualizar estado.' }); }
};

export const obtenerTrazabilidad = async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'SELECT t.*, gu.nombre as autor FROM conformidad_trazabilidad t JOIN global_usuarios gu ON t.usuario_uuid = gu.id WHERE t.conformidad_id = $1 ORDER BY t.created_at DESC';
        const { rows } = await pool.query(query, [id]);
        res.json(rows);
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al obtener trazabilidad.' }); }
};

export const obtenerEstadisticas = async (req, res) => {
    try {
        const { entidad_id } = req.query;
        let whereClause = '';
        let params = [];

        if (entidad_id) {
            whereClause = 'WHERE entidad_id = $1';
            params = [entidad_id];
        }

        const query = `
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE estado != 'CONFORMADO') as pendientes,
                SUM(valor) as monto_total
            FROM conformidades
            ${whereClause};
        `;
        const { rows: [kpis] } = await pool.query(query, params);

        const estadoQuery = `
            SELECT estado, COUNT(*) as total 
            FROM conformidades 
            ${whereClause}
            GROUP BY estado
        `;
        const { rows: estadoData } = await pool.query(estadoQuery, params);

        res.json({ kpis, estados: estadoData });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al obtener estadísticas.' }); }
};
