import pool from '../../../db/database.js';
import logger from '../../../utils/logger.js';

export const listarEstados = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM pago_estados WHERE is_active = true ORDER BY orden ASC');
        res.json(rows);
    } catch (error) {
        logger.error('listarEstados error', { error: error.message });
        res.status(500).json({ error: 'Error al listar estados.' });
    }
};

export const listarEstadosInactivos = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM pago_estados WHERE is_active = false ORDER BY orden ASC');
        res.json(rows);
    } catch (error) {
        logger.error('listarEstadosInactivos error', { error: error.message });
        res.status(500).json({ error: 'Error al listar estados inactivos.' });
    }
};

export const recuperarEstado = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE pago_estados SET is_active = true WHERE id = $1', [id]);
        res.json({ message: 'Estado recuperado.' });
    } catch (error) {
        logger.error('recuperarEstado error', { error: error.message });
        res.status(500).json({ error: 'Error al recuperar estado.' });
    }
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
        const result = await pool.query(query, [
            concepto, monto, acreedor_id, usuario_uuid, fecha_solicitud,
            soportes_link ?? null, tipo_pago ?? 'ESTANDAR', proyecto_id,
            wbe ?? null, metodo_pago ?? 'TRANSFERENCIA', codigo_sig ?? null,
        ]);

        await pool.query(
            'INSERT INTO pago_trazabilidad (pago_id, usuario_uuid, estado_nuevo, comentario) VALUES ($1, $2, $3, $4)',
            [result.rows[0].id, usuario_uuid, 'solicitado', 'Pago creado.']
        );

        res.status(201).json({ id: result.rows[0].id, message: 'Pago creado.' });
    } catch (error) {
        logger.error('crearPago error', { error: error.message });
        res.status(500).json({ error: 'Error al crear pago.' });
    }
};

export const listarPagos = async (req, res) => {
    try {
        const query = `
            SELECT p.*, gu.nombre as solicitante_nombre, ac.nombre as acreedor_nombre,
                   ac.nit, gp.nombre as proyecto_nombre,
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
    } catch (error) {
        logger.error('listarPagos error', { error: error.message });
        res.status(500).json({ error: 'Error al listar pagos.' });
    }
};

export const listarMisPagos = async (req, res) => {
    try {
        const query = `
            SELECT p.*, gu.nombre as solicitante_nombre, ac.nombre as acreedor_nombre,
                   ac.nit, gp.nombre as proyecto_nombre,
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
    } catch (error) {
        logger.error('listarMisPagos error', { error: error.message });
        res.status(500).json({ error: 'Error al listar mis pagos.' });
    }
};

export const listarGrupos = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM global_grupos WHERE is_active = true ORDER BY nombre ASC');
        res.json(rows);
    } catch (error) {
        logger.error('listarGrupos error', { error: error.message });
        res.status(500).json({ error: 'Error al listar grupos.' });
    }
};

export const asignarGrupoAPago = async (req, res) => {
    try {
        const { id } = req.params;
        const { grupo_id } = req.body;
        await pool.query('INSERT INTO pago_grupos (pago_id, grupo_id) VALUES ($1, $2)', [id, grupo_id]);
        res.status(201).json({ message: 'Grupo asignado.' });
    } catch (error) {
        logger.error('asignarGrupoAPago error', { error: error.message });
        res.status(500).json({ error: 'Error al asignar grupo.' });
    }
};

export const eliminarGrupoDePago = async (req, res) => {
    try {
        const { id, grupo_id } = req.params;
        await pool.query('DELETE FROM pago_grupos WHERE pago_id = $1 AND grupo_id = $2', [id, grupo_id]);
        res.json({ message: 'Grupo removido.' });
    } catch (error) {
        logger.error('eliminarGrupoDePago error', { error: error.message });
        res.status(500).json({ error: 'Error al remover grupo.' });
    }
};

export const actualizarEstadoPago = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, comentario, pdp_sap_id, soportes_link, concepto, monto, acreedor_id, tipo_pago, proyecto_id, wbe, metodo_pago, codigo_sig } = req.body;
        const usuario_uuid = req.user.id;

        const { rows } = await pool.query('SELECT estado FROM pagos WHERE id = $1', [id]);
        if (!rows.length) return res.status(404).json({ error: 'Pago no encontrado.' });
        const estadoAnterior = rows[0].estado;

        const isActive = estado !== 'pagado';

        // id en posición $3, extras se agregan dinámicamente después
        const params = [estado, isActive, id];
        let updateFields = 'estado = $1, is_active = $2';

        const extras = { pdp_sap_id, soportes_link, concepto, monto, acreedor_id, tipo_pago, proyecto_id, wbe, metodo_pago, codigo_sig };
        for (const [col, val] of Object.entries(extras)) {
            if (val !== undefined && val !== '') {
                params.push(val);
                updateFields += `, ${col} = $${params.length}`;
            }
        }

        if (estado === 'liberado') {
            const now = new Date().toISOString().split('T')[0];
            params.push(now);
            updateFields += `, fecha_liberacion = $${params.length}`;
        }

        await pool.query(`UPDATE pagos SET ${updateFields} WHERE id = $3`, params);

        await pool.query(
            'INSERT INTO pago_trazabilidad (pago_id, usuario_uuid, estado_anterior, estado_nuevo, comentario) VALUES ($1, $2, $3, $4, $5)',
            [id, usuario_uuid, estadoAnterior, estado, comentario]
        );

        res.json({ message: 'Estado de pago actualizado.' });
    } catch (error) {
        logger.error('actualizarEstadoPago error', { error: error.message });
        res.status(500).json({ error: 'Error al actualizar.' });
    }
};

export const obtenerTrazabilidad = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT t.*, gu.nombre as autor
            FROM pago_trazabilidad t
            JOIN global_usuarios gu ON t.usuario_uuid = gu.id
            WHERE t.pago_id = $1
            ORDER BY t.fecha DESC
        `;
        const { rows } = await pool.query(query, [id]);
        res.json(rows);
    } catch (error) {
        logger.error('obtenerTrazabilidad error', { error: error.message });
        res.status(500).json({ error: 'Error al listar trazabilidad.' });
    }
};

export const obtenerEstadisticas = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, solicitante_uuid } = req.query;
        const whereClauses = ['is_active = true'];
        const params = [];

        if (fecha_inicio) { params.push(fecha_inicio); whereClauses.push(`fecha_solicitud >= $${params.length}`); }
        if (fecha_fin) { params.push(fecha_fin); whereClauses.push(`fecha_solicitud <= $${params.length}`); }
        if (solicitante_uuid) { params.push(solicitante_uuid); whereClauses.push(`solicitante_uuid = $${params.length}`); }

        const whereSQL = `WHERE ${whereClauses.join(' AND ')}`;

        const [kpisRes, tendenciaRes] = await Promise.all([
            pool.query(`
                SELECT
                    COUNT(*) as total_pagos,
                    SUM(monto) as monto_total,
                    SUM(CASE WHEN estado = 'solicitado' THEN 1 ELSE 0 END) as solicitados,
                    SUM(CASE WHEN estado = 'liberado' THEN 1 ELSE 0 END) as liberados,
                    SUM(CASE WHEN estado = 'pagado' THEN 1 ELSE 0 END) as pagados,
                    SUM(CASE WHEN estado = 'rechazado' THEN 1 ELSE 0 END) as rechazados
                FROM pagos ${whereSQL}
            `, params),
            pool.query(`
                SELECT TO_CHAR(fecha_solicitud, 'YYYY-MM') as mes, estado, COUNT(*) as total
                FROM pagos ${whereSQL}
                GROUP BY mes, estado
                ORDER BY mes ASC
            `, params),
        ]);

        res.json({ kpis: kpisRes.rows[0], tendencia: tendenciaRes.rows });
    } catch (error) {
        logger.error('obtenerEstadisticas error', { error: error.message });
        res.status(500).json({ error: 'Error al obtener estadísticas.' });
    }
};
