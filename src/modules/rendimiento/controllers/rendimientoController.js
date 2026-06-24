import pool from '../../../db/database.js';
import logger from '../../../utils/logger.js';
import { crearNotificacion } from '../../notificaciones/services/notificationService.js';

export const registrarAccion = async (req, res) => {
    try {
        const { objetivo_id, comentario, peso } = req.body;
        const usuario_uuid = req.user.id;
        const pesoFinal = peso ?? 1;
        const result = await pool.query(
            'INSERT INTO registro_acciones (usuario_uuid, objetivo_id, comentario, peso) VALUES ($1, $2, $3, $4) RETURNING id',
            [usuario_uuid, objetivo_id, comentario, pesoFinal]
        );
        res.status(201).json({ id: result.rows[0].id, message: 'Acción registrada correctamente.' });
    } catch (error) {
        logger.error('registrarAccion error', { error: error.message });
        res.status(500).json({ error: 'Error al registrar acción.' });
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
            GROUP BY o.id, o.titulo, o.descripcion, o.meta_acciones, o.mes, o.anio, o.estado
        `;
        const { rows } = await pool.query(query, [usuario_uuid]);
        res.json(rows);
    } catch (error) {
        logger.error('obtenerCumplimientoIndividual error', { error: error.message });
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
            GROUP BY gu.id, gu.nombre, o.meta_acciones
        `;
        const { rows } = await pool.query(query, [equipo_id]);
        res.json(rows);
    } catch (error) {
        logger.error('obtenerCumplimientoEquipo error', { error: error.message });
        res.status(500).json({ error: 'Error al obtener cumplimiento de equipo.' });
    }
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
            ORDER BY mes ASC
        `;
        const { rows } = await pool.query(query, [equipo_id]);
        res.json(rows);
    } catch (error) {
        logger.error('obtenerHistorialEquipo error', { error: error.message });
        res.status(500).json({ error: 'Error al obtener historial de equipo.' });
    }
};

export const archivarObjetivo = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("UPDATE objetivos SET estado = 'archived' WHERE id = $1", [id]);
        res.json({ message: 'Objetivo archivado correctamente.' });
    } catch (error) {
        logger.error('archivarObjetivo error', { error: error.message });
        res.status(500).json({ error: 'Error al archivar objetivo.' });
    }
};

export const asignarUsuarioAEquipo = async (req, res) => {
    try {
        const { equipo_id, usuario_uuid } = req.body;

        const { rows } = await pool.query(
            `SELECT gu.equipo_id, e.nombre as equipo_nombre
             FROM global_usuarios gu
             LEFT JOIN global_areas_equipos e ON gu.equipo_id = e.id
             WHERE gu.id = $1`,
            [usuario_uuid]
        );

        if (rows.length > 0 && rows[0].equipo_id !== null && String(rows[0].equipo_id) !== String(equipo_id)) {
            const nombreEquipoActual = rows[0].equipo_nombre || 'otro equipo';
            return res.status(400).json({ error: `El usuario ya pertenece a: ${nombreEquipoActual}.` });
        }

        await pool.query('UPDATE global_usuarios SET equipo_id = $1 WHERE id = $2', [equipo_id, usuario_uuid]);

        const equipoRes = await pool.query('SELECT nombre FROM global_areas_equipos WHERE id = $1', [equipo_id]);
        const nombreEquipo = equipoRes.rows[0]?.nombre || 'un equipo';
        await crearNotificacion(
            usuario_uuid,
            `Fuiste agregado al equipo "${nombreEquipo}".`,
            'info',
            null,
            'rendimiento'
        ).catch(() => {});

        res.json({ message: 'Usuario asignado al equipo correctamente.' });
    } catch (error) {
        logger.error('asignarUsuarioAEquipo error', { error: error.message });
        res.status(500).json({ error: 'Error al asignar usuario al equipo.' });
    }
};

export const removerUsuarioDeEquipo = async (req, res) => {
    try {
        const { usuario_uuid } = req.body;

        await pool.query(
            "UPDATE objetivos SET estado = 'archived' WHERE usuario_uuid = $1 AND estado = 'active'",
            [usuario_uuid]
        );
        await pool.query('UPDATE global_usuarios SET equipo_id = NULL WHERE id = $1', [usuario_uuid]);

        await crearNotificacion(
            usuario_uuid,
            'Fuiste removido de tu equipo de rendimiento.',
            'alerta',
            null,
            'rendimiento'
        ).catch(() => {});

        res.json({ message: 'Usuario removido del equipo y objetivos archivados correctamente.' });
    } catch (error) {
        logger.error('removerUsuarioDeEquipo error', { error: error.message });
        res.status(500).json({ error: 'Error al remover usuario del equipo.' });
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
        logger.error('obtenerCumplimientoGlobal error', { error: error.message });
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
            ORDER BY ra.fecha_registro DESC
        `;
        const { rows } = await pool.query(query, [objetivo_id]);
        res.json(rows);
    } catch (error) {
        logger.error('obtenerHistorialAccionesObjetivo error', { error: error.message });
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
            ORDER BY gu.nombre, o.mes, o.anio, ra.fecha_registro DESC
        `;
        const { rows } = await pool.query(query, [equipo_id]);
        res.json(rows);
    } catch (error) {
        logger.error('exportarDatosEquipo error', { error: error.message });
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
            GROUP BY o.id, o.titulo, o.descripcion, o.meta_acciones, o.estado, o.mes, o.anio
        `;
        const { rows } = await pool.query(query, [equipo_id]);
        res.json(rows);
    } catch (error) {
        logger.error('listarObjetivosPorEquipo error', { error: error.message });
        res.status(500).json({ error: 'Error al listar objetivos del equipo.' });
    }
};
