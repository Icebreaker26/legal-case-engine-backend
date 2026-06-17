import pool from '../../../db/database.js';

export const listarEstados = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM pago_estados WHERE is_active = true ORDER BY orden ASC');
        res.json(rows);
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al listar estados.' }); }
};

export const listarEstadosInactivos = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM pago_estados WHERE is_active = false ORDER BY orden ASC');
        res.json(rows);
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al listar estados inactivos.' }); }
};

export const recuperarEstado = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE pago_estados SET is_active = true WHERE id = $1', [id]);
        res.json({ message: 'Estado recuperado.' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al recuperar estado.' }); }
};

export const crearPago = async (req, res) => {
    try {
        const { concepto, monto, acreedor_id, fecha_solicitud, soportes_link, tipo_pago, proyecto_id, wbe, metodo_pago, codigo_sig } = req.body;
        const usuario_uuid = req.user.id;
        const query = `
            INSERT INTO pagos (concepto, monto, acreedor_id, solicitante_uuid, estado, fecha_solicitud, soportes_link, tipo_pago, proyecto_id, wbe, metodo_pago, codigo_sig) 
            VALUES ($1, $2, $3, $4, 'solicitado', $5, $6, $7, $8, $9, $10, $11) 
            RETURNING id
        `;
        const result = await pool.query(query, [concepto, monto, acreedor_id, usuario_uuid, fecha_solicitud, soportes_link, tipo_pago || 'ESTANDAR', proyecto_id, wbe, metodo_pago, codigo_sig]);
        
        // Registro inicial de trazabilidad
        await pool.query('INSERT INTO pago_trazabilidad (pago_id, usuario_uuid, estado_nuevo, comentario) VALUES ($1, $2, $3, $4)', 
            [result.rows[0].id, usuario_uuid, 'solicitado', 'Pago creado.']);

        res.status(201).json({ id: result.rows[0].id, message: 'Pago creado.' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al crear pago.' }); }
};

export const listarPagos = async (req, res) => {
    try {
        const query = `
            SELECT p.*, gu.nombre as solicitante_nombre, ac.nombre as acreedor_nombre, 
            COALESCE(ac.nit, p.nit) as nit, gp.nombre as proyecto_nombre,
            ARRAY_AGG(DISTINCT g.nombre) FILTER (WHERE g.nombre IS NOT NULL) as grupos
            FROM pagos p
            LEFT JOIN global_usuarios gu ON p.solicitante_uuid = gu.id
            LEFT JOIN global_acreedores ac ON p.acreedor_id = ac.id
            LEFT JOIN global_proyectos gp ON p.proyecto_id = gp.id
            LEFT JOIN pago_grupos pg ON p.id = pg.pago_id
            LEFT JOIN global_grupos g ON pg.grupo_id = g.id
            GROUP BY p.id, gu.nombre, ac.nombre, ac.nit, gp.nombre
            ORDER BY p.created_at DESC
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al listar pagos.' }); }
};

export const listarMisPagos = async (req, res) => {
    try {
        const query = `
            SELECT p.*, gu.nombre as solicitante_nombre, ac.nombre as acreedor_nombre, 
            COALESCE(ac.nit, p.nit) as nit, gp.nombre as proyecto_nombre,
            ARRAY_AGG(DISTINCT g.nombre) FILTER (WHERE g.nombre IS NOT NULL) as grupos
            FROM pagos p
            LEFT JOIN global_usuarios gu ON p.solicitante_uuid = gu.id
            LEFT JOIN global_acreedores ac ON p.acreedor_id = ac.id
            LEFT JOIN global_proyectos gp ON p.proyecto_id = gp.id
            LEFT JOIN pago_grupos pg ON p.id = pg.pago_id
            LEFT JOIN global_grupos g ON pg.grupo_id = g.id
            WHERE p.solicitante_uuid = $1
            GROUP BY p.id, gu.nombre, ac.nombre, ac.nit, gp.nombre
            ORDER BY p.created_at DESC
        `;
        const { rows } = await pool.query(query, [req.user.id]);
        res.json(rows);
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al listar mis pagos.' }); }
};

export const listarGrupos = async (req, res) => {
    try { const { rows } = await pool.query('SELECT * FROM global_grupos WHERE is_active = true ORDER BY nombre ASC'); res.json(rows); } catch (error) { console.error(error); res.status(500).json({ error: 'Error al listar grupos.' }); }
};

export const asignarGrupoAPago = async (req, res) => {
    try { const { id } = req.params; const { grupo_id } = req.body; await pool.query('INSERT INTO pago_grupos (pago_id, grupo_id) VALUES ($1, $2)', [id, grupo_id]); res.status(201).json({ message: 'Grupo asignado.' }); } catch (error) { console.error(error); res.status(500).json({ error: 'Error al asignar grupo.' }); }
};

export const eliminarGrupoDePago = async (req, res) => {
    try { const { id, grupo_id } = req.params; await pool.query('DELETE FROM pago_grupos WHERE pago_id = $1 AND grupo_id = $2', [id, grupo_id]); res.json({ message: 'Grupo removido.' }); } catch (error) { console.error(error); res.status(500).json({ error: 'Error al remover grupo.' }); }
};


export const actualizarEstadoPago = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, comentario, pdp_sap_id, soportes_link, concepto, monto, acreedor_id, tipo_pago, proyecto_id, wbe, metodo_pago, codigo_sig } = req.body;
        const usuario_uuid = req.user.id;

        const old = await pool.query('SELECT * FROM pagos WHERE id = $1', [id]);
        
        const isActive = estado !== 'pagado';
        
        let updateQuery = 'UPDATE pagos SET estado = $1, is_active = $2';
        let params = [estado, isActive, id];
        
        if (pdp_sap_id) { updateQuery += ', pdp_sap_id = $' + (params.length + 1); params.push(pdp_sap_id); }
        if (soportes_link) { updateQuery += ', soportes_link = $' + (params.length + 1); params.push(soportes_link); }
        if (concepto) { updateQuery += ', concepto = $' + (params.length + 1); params.push(concepto); }
        if (monto) { updateQuery += ', monto = $' + (params.length + 1); params.push(monto); }
        if (acreedor_id) { updateQuery += ', acreedor_id = $' + (params.length + 1); params.push(acreedor_id); }
        if (tipo_pago) { updateQuery += ', tipo_pago = $' + (params.length + 1); params.push(tipo_pago); }
        if (proyecto_id) { updateQuery += ', proyecto_id = $' + (params.length + 1); params.push(proyecto_id); }
        if (wbe) { updateQuery += ', wbe = $' + (params.length + 1); params.push(wbe); }
        if (metodo_pago) { updateQuery += ', metodo_pago = $' + (params.length + 1); params.push(metodo_pago); }
        if (codigo_sig) { updateQuery += ', codigo_sig = $' + (params.length + 1); params.push(codigo_sig); }
        
        const now = new Date().toISOString().split('T')[0];
        if (estado === 'liberado') { updateQuery += ', fecha_liberacion = $' + (params.length + 1); params.push(now); }
        
        updateQuery += ' WHERE id = $3';
        await pool.query(updateQuery, params);
        
        await pool.query('INSERT INTO pago_trazabilidad (pago_id, usuario_uuid, estado_anterior, estado_nuevo, comentario) VALUES ($1, $2, $3, $4, $5)', 
            [id, usuario_uuid, old.rows[0].estado, estado, comentario]);
            
        res.json({ message: 'Estado de pago actualizado.' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al actualizar.' }); }
};

export const obtenerTrazabilidad = async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'SELECT t.*, gu.nombre as autor FROM pago_trazabilidad t JOIN global_usuarios gu ON t.usuario_uuid = gu.id WHERE t.pago_id = $1 ORDER BY t.fecha DESC';
        const { rows } = await pool.query(query, [id]);
        res.json(rows);
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al listar trazabilidad.' }); }
};

export const obtenerEstadisticas = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, solicitante_id } = req.query;
        let whereClauses = ["is_active = true"];
        let params = [];

        if (fecha_inicio) { params.push(fecha_inicio); whereClauses.push(`fecha_solicitud >= $${params.length}`); }
        if (fecha_fin) { params.push(fecha_fin); whereClauses.push(`fecha_solicitud <= $${params.length}`); }
        if (solicitante_id) { params.push(solicitante_id); whereClauses.push(`solicitante_id = $${params.length}`); }

        const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const kpisQuery = `
            SELECT 
                COUNT(*) as total_pagos,
                SUM(monto) as monto_total,
                SUM(CASE WHEN estado = 'solicitado' THEN 1 ELSE 0 END) as solicitados,
                SUM(CASE WHEN estado = 'liberado' THEN 1 ELSE 0 END) as liberados,
                SUM(CASE WHEN estado = 'pagado' THEN 1 ELSE 0 END) as pagados,
                SUM(CASE WHEN estado = 'rechazado' THEN 1 ELSE 0 END) as rechazados
            FROM pagos ${whereSQL};
        `;
        const tendenciaQuery = `
            SELECT TO_CHAR(fecha_solicitud, 'YYYY-MM') as mes, 
            estado,
            COUNT(*) as total
            FROM pagos ${whereSQL}
            GROUP BY mes, estado
            ORDER BY mes ASC;
        `;

        const kpis = await pool.query(kpisQuery, params);
        const tendencia = await pool.query(tendenciaQuery, params);

        res.json({
            kpis: kpis.rows[0],
            tendencia: tendencia.rows
        });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al obtener estadísticas.' }); }
};
