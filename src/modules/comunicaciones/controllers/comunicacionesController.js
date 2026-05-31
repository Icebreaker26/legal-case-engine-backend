import pool from '../../../db/database.js';

export const crearComunicacion = async (req, res) => {
    try {
        const { entidad_id, tipo, asunto, fecha_recepcion, fecha_limite, responsable_id, descripcion, link } = req.body;
        const fechaLimiteFormateada = fecha_limite && fecha_limite.trim() !== '' ? fecha_limite : null;
        const query = 'INSERT INTO comunicaciones (entidad_id, tipo, asunto, fecha_recepcion, fecha_limite, responsable_id, estado, descripcion, link) VALUES ($1, $2, $3, $4, $5, $6, \'pendiente\', $7, $8) RETURNING id';
        const result = await pool.query(query, [entidad_id, tipo, asunto, fecha_recepcion, fechaLimiteFormateada, responsable_id, descripcion, link]);
        res.status(201).json({ id: result.rows[0].id, message: 'Comunicación creada.' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al crear.' }); }
};

export const listarComunicaciones = async (req, res) => {
    try {
        const query = `
            SELECT c.*, a.nombre as responsable_nombre, e.nombre as entidad,
            ARRAY_AGG(DISTINCT g.nombre) as grupos
            FROM comunicaciones c
            LEFT JOIN abogados a ON c.responsable_id = a.id
            LEFT JOIN entidades e ON c.entidad_id = e.id
            LEFT JOIN comunicacion_grupos cg ON c.id = cg.comunicacion_id
            LEFT JOIN grupos g ON cg.grupo_id = g.id
            WHERE c.is_active = true
            GROUP BY c.id, a.nombre, e.nombre
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al listar.' }); }
};

export const listarGrupos = async (req, res) => {
    try { const { rows } = await pool.query('SELECT * FROM grupos WHERE is_active = true ORDER BY nombre ASC'); res.json(rows); } catch (error) { console.error(error); res.status(500).json({ error: 'Error al listar grupos.' }); }
};

export const listarInactivosGrupos = async (req, res) => {
    try { const { rows } = await pool.query('SELECT * FROM grupos WHERE is_active = false ORDER BY nombre ASC'); res.json(rows); } catch (error) { console.error(error); res.status(500).json({ error: 'Error al listar grupos inactivos.' }); }
};

export const crearGrupo = async (req, res) => {
    try { const { nombre } = req.body; const result = await pool.query('INSERT INTO grupos (nombre) VALUES ($1) RETURNING id', [nombre]); res.status(201).json({ id: result.rows[0].id, nombre }); } catch (error) { console.error(error); res.status(500).json({ error: 'Error al crear grupo.' }); }
};

export const actualizarGrupo = async (req, res) => {
    try { const { id } = req.params; const { nombre } = req.body; await pool.query('UPDATE grupos SET nombre = $1 WHERE id = $2', [nombre, id]); res.json({ message: 'Grupo actualizado.' }); } catch (error) { console.error(error); res.status(500).json({ error: 'Error al actualizar grupo.' }); }
};

export const eliminarGrupo = async (req, res) => {
    try { const { id } = req.params; await pool.query('UPDATE grupos SET is_active = false WHERE id = $1', [id]); res.json({ message: 'Grupo eliminado.' }); } catch (error) { console.error(error); res.status(500).json({ error: 'Error al eliminar grupo.' }); }
};

export const recuperarGrupo = async (req, res) => {
    try { const { id } = req.params; await pool.query('UPDATE grupos SET is_active = true WHERE id = $1', [id]); res.json({ message: 'Grupo recuperado.' }); } catch (error) { console.error(error); res.status(500).json({ error: 'Error al recuperar grupo.' }); }
};

export const asignarGrupoAComunicacion = async (req, res) => {
    try { const { id } = req.params; const { grupo_id } = req.body; await pool.query('INSERT INTO comunicacion_grupos (comunicacion_id, grupo_id) VALUES ($1, $2)', [id, grupo_id]); res.status(201).json({ message: 'Grupo asignado.' }); } catch (error) { console.error(error); res.status(500).json({ error: 'Error al asignar grupo.' }); }
};

export const eliminarGrupoDeComunicacion = async (req, res) => {
    try { const { id, grupo_id } = req.params; await pool.query('DELETE FROM comunicacion_grupos WHERE comunicacion_id = $1 AND grupo_id = $2', [id, grupo_id]); res.json({ message: 'Grupo removido.' }); } catch (error) { console.error(error); res.status(500).json({ error: 'Error al remover grupo.' }); }
};

export const listarEntidades = async (req, res) => {
    try { const { rows } = await pool.query('SELECT * FROM entidades WHERE is_active = true ORDER BY nombre ASC'); res.json(rows); } catch (error) { console.error(error); res.status(500).json({ error: 'Error al listar entidades.' }); }
};

export const listarInactivosEntidades = async (req, res) => {
    try { const { rows } = await pool.query('SELECT * FROM entidades WHERE is_active = false ORDER BY nombre ASC'); res.json(rows); } catch (error) { console.error(error); res.status(500).json({ error: 'Error al listar entidades inactivas.' }); }
};

export const crearEntidad = async (req, res) => {
    try { const { nombre } = req.body; const result = await pool.query('INSERT INTO entidades (nombre) VALUES ($1) RETURNING id', [nombre]); res.status(201).json({ id: result.rows[0].id, nombre }); } catch (error) { console.error(error); res.status(500).json({ error: 'Error al crear entidad.' }); }
};

export const actualizarEntidad = async (req, res) => {
    try { const { id } = req.params; const { nombre } = req.body; await pool.query('UPDATE entidades SET nombre = $1 WHERE id = $2', [nombre, id]); res.json({ message: 'Entidad actualizada.' }); } catch (error) { console.error(error); res.status(500).json({ error: 'Error al actualizar entidad.' }); }
};

export const eliminarEntidad = async (req, res) => {
    try { const { id } = req.params; await pool.query('UPDATE entidades SET is_active = false WHERE id = $1', [id]); res.json({ message: 'Entidad eliminada.' }); } catch (error) { console.error(error); res.status(500).json({ error: 'Error al eliminar entidad.' }); }
};

export const recuperarEntidad = async (req, res) => {
    try { const { id } = req.params; await pool.query('UPDATE entidades SET is_active = true WHERE id = $1', [id]); res.json({ message: 'Entidad recuperada.' }); } catch (error) { console.error(error); res.status(500).json({ error: 'Error al recuperar entidad.' }); }
};

export const actualizarComunicacion = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, responsable_id, asunto, descripcion, link } = req.body;
        const usuario_id = req.user.id;
        const old = await pool.query('SELECT * FROM comunicaciones WHERE id = $1', [id]);
        await pool.query('UPDATE comunicaciones SET estado = $1, responsable_id = $2, asunto = $3, descripcion = $4, link = $5 WHERE id = $6', [estado, responsable_id, asunto, descripcion, link, id]);
        let cambio = `Comunicación actualizada: `;
        if (old.rows[0].estado !== estado) cambio += `Estado de ${old.rows[0].estado} a ${estado}. `;
        if (old.rows[0].responsable_id !== responsable_id) cambio += `Responsable cambiado. `;
        await pool.query('INSERT INTO comunicacion_trazabilidad (comunicacion_id, usuario_id, comentario) VALUES ($1, $2, $3)', [id, usuario_id, cambio]);
        res.json({ message: 'Comunicación actualizada.' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al actualizar.' }); }
};

export const archivarComunicacion = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario_id = req.user.id;
        await pool.query('UPDATE comunicaciones SET is_active = false WHERE id = $1', [id]);
        await pool.query('INSERT INTO comunicacion_trazabilidad (comunicacion_id, usuario_id, comentario) VALUES ($1, $2, $3)', [id, usuario_id, 'Comunicación archivada.']);
        res.json({ message: 'Comunicación archivada.' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al archivar.' }); }
};

export const recuperarComunicacion = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario_id = req.user.id;
        await pool.query('UPDATE comunicaciones SET is_active = true, estado = \'pendiente\' WHERE id = $1', [id]);
        await pool.query('INSERT INTO comunicacion_trazabilidad (comunicacion_id, usuario_id, comentario) VALUES ($1, $2, $3)', [id, usuario_id, 'Comunicación recuperada y marcada como pendiente.']);
        res.json({ message: 'Comunicación recuperada.' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al recuperar.' }); }
};

export const marcarComoRespondida = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario_id = req.user.id;
        await pool.query('UPDATE comunicaciones SET estado = \'respondida\', is_active = false WHERE id = $1', [id]);
        await pool.query('INSERT INTO comunicacion_trazabilidad (comunicacion_id, usuario_id, comentario) VALUES ($1, $2, $3)', [id, usuario_id, 'Comunicación marcada como respondida y archivada automáticamente.']);
        res.json({ message: 'Comunicación marcada como respondida.' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al marcar como respondida.' }); }
};

export const eliminarComunicacion = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE comunicaciones SET is_active = false WHERE id = $1', [id]);
        res.json({ message: 'Comunicación eliminada.' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al eliminar.' }); }
};

export const agregarComentario = async (req, res) => {
    try {
        const { id } = req.params;
        const { comentario } = req.body;
        const usuario_id = req.user.id;
        await pool.query('INSERT INTO comunicacion_trazabilidad (comunicacion_id, usuario_id, comentario) VALUES ($1, $2, $3)', [id, usuario_id, comentario]);
        res.status(201).json({ message: 'Comentario añadido.' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al añadir comentario.' }); }
};

export const listarComentarios = async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'SELECT t.*, a.nombre as autor FROM comunicacion_trazabilidad t JOIN abogados a ON t.usuario_id = a.id WHERE t.comunicacion_id = $1 ORDER BY t.fecha DESC';
        const { rows } = await pool.query(query, [id]);
        res.json(rows);
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al listar comentarios.' }); }
};

export const obtenerEstadisticas = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, entidad_id, grupo_id, responsable_id } = req.query;
        let whereClauses = ["1=1"];
        let params = [];
        let joinQuery = "";

        if (fecha_inicio) { params.push(fecha_inicio); whereClauses.push(`c.fecha_recepcion >= $${params.length}`); }
        if (fecha_fin) { params.push(fecha_fin); whereClauses.push(`c.fecha_recepcion <= $${params.length}`); }
        if (entidad_id) { params.push(entidad_id); whereClauses.push(`c.entidad_id = $${params.length}`); }
        if (grupo_id) { 
            params.push(grupo_id); 
            joinQuery = `JOIN comunicacion_grupos cg ON c.id = cg.comunicacion_id`;
            whereClauses.push(`cg.grupo_id = $${params.length}`); 
        }
        if (responsable_id) { params.push(responsable_id); whereClauses.push(`c.responsable_id = $${params.length}`); }

        const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const kpisQuery = `
            SELECT 
                COUNT(DISTINCT c.id) as total,
                SUM(CASE WHEN c.estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
                SUM(CASE WHEN c.estado = 'respondida' THEN 1 ELSE 0 END) as respondidas,
                SUM(CASE WHEN c.fecha_limite < CURRENT_TIMESTAMP AND c.estado != 'respondida' AND c.is_active = true THEN 1 ELSE 0 END) as vencidas,
                (SELECT e.nombre FROM entidades e JOIN comunicaciones c2 ON e.id = c2.entidad_id WHERE c2.is_active = true GROUP BY e.nombre ORDER BY COUNT(*) DESC LIMIT 1) as entidad_mas_activa
            FROM comunicaciones c ${joinQuery} ${whereSQL};
        `;
        const volumenEntidadQuery = `
            SELECT e.nombre, COUNT(c.id) as total
            FROM comunicaciones c
            JOIN entidades e ON c.entidad_id = e.id ${joinQuery}
            ${whereSQL}
            GROUP BY e.nombre
            ORDER BY total DESC
            LIMIT 5;
        `;
        const tendenciaQuery = `
            SELECT TO_CHAR(c.fecha_recepcion, 'YYYY-MM') as mes, 
            SUM(CASE WHEN c.tipo = 'recibida' THEN 1 ELSE 0 END) as recibidas,
            SUM(CASE WHEN c.tipo = 'enviada' THEN 1 ELSE 0 END) as enviadas
            FROM comunicaciones c ${joinQuery}
            ${whereSQL}
            GROUP BY mes
            ORDER BY mes ASC;
        `;

        const kpis = await pool.query(kpisQuery, params);
        const volumen = await pool.query(volumenEntidadQuery, params);
        const tendencia = await pool.query(tendenciaQuery, params);

        res.json({
            kpis: kpis.rows[0],
            volumenPorEntidad: volumen.rows,
            tendencia: tendencia.rows
        });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al obtener estadísticas.' }); }
};
