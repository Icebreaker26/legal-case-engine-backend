import pool from '../../../db/database.js';
import logger from '../../../utils/logger.js';
import { crearNotificacion } from '../../notificaciones/services/notificationService.js';

export const crearObjetivo = async (req, res) => {
    try {
        const { usuario_uuid, meta_acciones, mes, anio, titulo, descripcion } = req.body;
        const result = await pool.query(
            'INSERT INTO objetivos (usuario_uuid, meta_acciones, mes, anio, titulo, descripcion) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [usuario_uuid, meta_acciones, mes, anio, titulo, descripcion ?? null]
        );

        if (usuario_uuid !== req.user.id) {
            await crearNotificacion(
                usuario_uuid,
                `Se te asignó un nuevo objetivo: "${titulo}".`,
                'info',
                result.rows[0].id,
                'rendimiento'
            ).catch(() => {});
        }

        res.status(201).json({ id: result.rows[0].id, message: 'Objetivo creado correctamente.' });
    } catch (error) {
        logger.error('crearObjetivo error', { error: error.message });
        res.status(500).json({ error: 'Error al crear objetivo.' });
    }
};

export const listarObjetivos = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM objetivos');
        res.json(rows);
    } catch (error) {
        logger.error('listarObjetivos error', { error: error.message });
        res.status(500).json({ error: 'Error al listar objetivos.' });
    }
};

export const listarMisObjetivos = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM objetivos WHERE usuario_uuid = $1', [req.user.id]);
        res.json(rows);
    } catch (error) {
        logger.error('listarMisObjetivos error', { error: error.message });
        res.status(500).json({ error: 'Error al listar mis objetivos.' });
    }
};

export const actualizarObjetivo = async (req, res) => {
    try {
        const { id } = req.params;
        const { meta_acciones, mes, anio, titulo, descripcion } = req.body;
        await pool.query(
            `UPDATE objetivos
             SET meta_acciones = COALESCE($1, meta_acciones),
                 mes = COALESCE($2, mes),
                 anio = COALESCE($3, anio),
                 titulo = COALESCE($4, titulo),
                 descripcion = COALESCE($5, descripcion)
             WHERE id = $6`,
            [meta_acciones ?? null, mes ?? null, anio ?? null, titulo ?? null, descripcion ?? null, id]
        );
        res.json({ message: 'Objetivo actualizado correctamente.' });
    } catch (error) {
        logger.error('actualizarObjetivo error', { error: error.message });
        res.status(500).json({ error: 'Error al actualizar objetivo.' });
    }
};

export const eliminarObjetivo = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM objetivos WHERE id = $1', [id]);
        res.json({ message: 'Objetivo eliminado correctamente.' });
    } catch (error) {
        logger.error('eliminarObjetivo error', { error: error.message });
        res.status(500).json({ error: 'Error al eliminar objetivo.' });
    }
};
