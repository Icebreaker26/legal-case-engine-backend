import pool from '../../../db/database.js';

export const listarEstados = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM pago_estados WHERE is_active = true ORDER BY orden ASC');
        res.json(rows);
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al listar estados.' }); }
};

export const crearPago = async (req, res) => {
    try {
        const { concepto, monto, nit, solicitante_id, fecha_solicitud, soportes_link } = req.body;
        const query = `
            INSERT INTO pagos (concepto, monto, nit, solicitante_id, estado, fecha_solicitud, soportes_link) 
            VALUES ($1, $2, $3, $4, 'solicitado', $5, $6) 
            RETURNING id
        `;
        const result = await pool.query(query, [concepto, monto, nit, solicitante_id, fecha_solicitud, soportes_link]);
        
        // Registro inicial de trazabilidad
        await pool.query('INSERT INTO pago_trazabilidad (pago_id, usuario_id, estado_nuevo, comentario) VALUES ($1, $2, $3, $4)', 
            [result.rows[0].id, req.user.id, 'solicitado', 'Pago creado.']);

        res.status(201).json({ id: result.rows[0].id, message: 'Pago creado.' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al crear pago.' }); }
};

export const listarPagos = async (req, res) => {
    try {
        const query = `
            SELECT p.*, a.nombre as solicitante_nombre,
            ARRAY_AGG(DISTINCT g.nombre) FILTER (WHERE g.nombre IS NOT NULL) as grupos
            FROM pagos p
            LEFT JOIN abogados a ON p.solicitante_id = a.id
            LEFT JOIN pago_grupos pg ON p.id = pg.pago_id
            LEFT JOIN grupos g ON pg.grupo_id = g.id
            GROUP BY p.id, a.nombre
            ORDER BY p.created_at DESC
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al listar pagos.' }); }
};

export const listarMisPagos = async (req, res) => {
    try {
        const query = `
            SELECT p.*, a.nombre as solicitante_nombre,
            ARRAY_AGG(DISTINCT g.nombre) FILTER (WHERE g.nombre IS NOT NULL) as grupos
            FROM pagos p
            LEFT JOIN abogados a ON p.solicitante_id = a.id
            LEFT JOIN pago_grupos pg ON p.id = pg.pago_id
            LEFT JOIN grupos g ON pg.grupo_id = g.id
            WHERE p.solicitante_id = $1
            GROUP BY p.id, a.nombre
            ORDER BY p.created_at DESC
        `;
        const { rows } = await pool.query(query, [req.user.id]);
        res.json(rows);
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al listar mis pagos.' }); }
};

export const listarGrupos = async (req, res) => {
    try { const { rows } = await pool.query('SELECT * FROM grupos WHERE is_active = true ORDER BY nombre ASC'); res.json(rows); } catch (error) { console.error(error); res.status(500).json({ error: 'Error al listar grupos.' }); }
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
        const { estado, comentario, pdp_sap_id, soportes_link } = req.body;
        const usuario_id = req.user.id;

        const old = await pool.query('SELECT * FROM pagos WHERE id = $1', [id]);
        
        // Determinar si el pago debe quedar inactivo: solo si el nuevo estado es 'pagado'
        const isActive = estado !== 'pagado';
        
        let updateQuery = 'UPDATE pagos SET estado = $1, is_active = $2';
        let params = [estado, isActive, id];
        
        if (pdp_sap_id) { updateQuery += ', pdp_sap_id = $' + (params.length + 1); params.push(pdp_sap_id); }
        if (soportes_link) { updateQuery += ', soportes_link = $' + (params.length + 1); params.push(soportes_link); }
        
        // Actualizar fechas de hitos según estado
        const now = new Date().toISOString().split('T')[0];
        if (estado === 'liberado') { updateQuery += ', fecha_liberacion = $' + (params.length + 1); params.push(now); }
        
        updateQuery += ' WHERE id = $3'; // id es el tercer parametro ahora
        await pool.query(updateQuery, params);
        
        await pool.query('INSERT INTO pago_trazabilidad (pago_id, usuario_id, estado_anterior, estado_nuevo, comentario) VALUES ($1, $2, $3, $4, $5)', 
            [id, usuario_id, old.rows[0].estado, estado, comentario]);
            
        res.json({ message: 'Estado de pago actualizado.' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Error al actualizar.' }); }
};

export const obtenerTrazabilidad = async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'SELECT t.*, a.nombre as autor FROM pago_trazabilidad t JOIN abogados a ON t.usuario_id = a.id WHERE t.pago_id = $1 ORDER BY t.fecha DESC';
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
