import pool from '../../../db/database.js';
import logger from '../../../utils/logger.js';
import { crearNotificacion } from '../../notificaciones/services/notificationService.js';

export const crearComunicacion = async (req, res) => {
    try {
        const { entidad_id, tipo, asunto, fecha_recepcion, fecha_limite, responsable_uuid, descripcion, link } = req.body;
        const fechaLimiteFormateada = fecha_limite && fecha_limite.trim() !== '' ? fecha_limite : null;
        const responsableVal = responsable_uuid && responsable_uuid.trim() !== '' ? responsable_uuid : null;

        const query = `
            INSERT INTO comunicaciones (entidad_id, tipo, asunto, fecha_recepcion, fecha_limite, responsable_uuid, estado, descripcion, link)
            VALUES ($1, $2, $3, $4, $5, $6, 'pendiente', $7, $8)
            RETURNING id
        `;
        const result = await pool.query(query, [entidad_id, tipo, asunto, fecha_recepcion, fechaLimiteFormateada, responsableVal, descripcion, link]);

        if (responsableVal && responsableVal !== req.user?.id) {
            await crearNotificacion(responsableVal, `Se te asignó la comunicación: "${asunto}".`, 'info', result.rows[0].id, 'comunicaciones').catch(() => {});
        }

        res.status(201).json({ id: result.rows[0].id, message: 'Comunicación creada.' });
    } catch (error) {
        logger.error('crearComunicacion error', { error: error.message });
        res.status(500).json({ error: 'Error al crear.' });
    }
};

export const listarComunicaciones = async (req, res) => {
    try {
        const query = `
            SELECT c.*, gu.nombre as responsable_nombre, ge.nombre as entidad,
            ARRAY_AGG(DISTINCT gg.nombre) FILTER (WHERE gg.nombre IS NOT NULL) as grupos
            FROM comunicaciones c
            LEFT JOIN global_usuarios gu ON c.responsable_uuid = gu.id
            LEFT JOIN global_entidades ge ON c.entidad_id = ge.id
            LEFT JOIN comunicacion_grupos cg ON c.id = cg.comunicacion_id
            LEFT JOIN global_grupos gg ON cg.grupo_id = gg.id
            GROUP BY c.id, gu.nombre, ge.nombre
            ORDER BY c.created_at DESC
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) {
        logger.error('listarComunicaciones error', { error: error.message });
        res.status(500).json({ error: 'Error al listar.' });
    }
};

export const listarMisComunicaciones = async (req, res) => {
    try {
        const query = `
            SELECT c.*, gu.nombre as responsable_nombre, ge.nombre as entidad,
            ARRAY_AGG(DISTINCT gg.nombre) FILTER (WHERE gg.nombre IS NOT NULL) as grupos
            FROM comunicaciones c
            LEFT JOIN global_usuarios gu ON c.responsable_uuid = gu.id
            LEFT JOIN global_entidades ge ON c.entidad_id = ge.id
            LEFT JOIN comunicacion_grupos cg ON c.id = cg.comunicacion_id
            LEFT JOIN global_grupos gg ON cg.grupo_id = gg.id
            WHERE c.responsable_uuid = $1
            GROUP BY c.id, gu.nombre, ge.nombre
            ORDER BY c.created_at DESC
        `;
        const { rows } = await pool.query(query, [req.user.id]);
        res.json(rows);
    } catch (error) {
        logger.error('listarMisComunicaciones error', { error: error.message });
        res.status(500).json({ error: 'Error al listar mis comunicaciones.' });
    }
};

export const asignarGrupoAComunicacion = async (req, res) => {
    try {
        const { id } = req.params;
        const { grupo_id } = req.body;
        await pool.query('INSERT INTO comunicacion_grupos (comunicacion_id, grupo_id) VALUES ($1, $2)', [id, grupo_id]);
        res.status(201).json({ message: 'Grupo asignado.' });
    } catch (error) {
        logger.error('asignarGrupoAComunicacion error', { error: error.message });
        res.status(500).json({ error: 'Error al asignar grupo.' });
    }
};

export const eliminarGrupoDeComunicacion = async (req, res) => {
    try {
        const { id, grupo_id } = req.params;
        await pool.query('DELETE FROM comunicacion_grupos WHERE comunicacion_id = $1 AND grupo_id = $2', [id, grupo_id]);
        res.json({ message: 'Grupo removido.' });
    } catch (error) {
        logger.error('eliminarGrupoDeComunicacion error', { error: error.message });
        res.status(500).json({ error: 'Error al remover grupo.' });
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

export const listarEntidades = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM global_entidades WHERE is_active = true ORDER BY nombre ASC');
        res.json(rows);
    } catch (error) {
        logger.error('listarEntidades error', { error: error.message });
        res.status(500).json({ error: 'Error al listar entidades.' });
    }
};

export const actualizarComunicacion = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, responsable_uuid, asunto, descripcion, link } = req.body;
        const usuario_uuid = req.user.id;
        const old = await pool.query('SELECT * FROM comunicaciones WHERE id = $1', [id]);
        if (!old.rows.length) return res.status(404).json({ error: 'Comunicación no encontrada.' });

        const prev = old.rows[0];
        const nuevoEstado = estado ?? prev.estado;
        const isActive = nuevoEstado !== 'respondida';

        await pool.query(
            `UPDATE comunicaciones
             SET estado = $1,
                 is_active = $2,
                 responsable_uuid = COALESCE($3, responsable_uuid),
                 asunto = COALESCE($4, asunto),
                 descripcion = COALESCE($5, descripcion),
                 link = COALESCE($6, link)
             WHERE id = $7`,
            [nuevoEstado, isActive, responsable_uuid ?? null, asunto ?? null, descripcion ?? null, link ?? null, id]
        );

        let cambio = 'Comunicación actualizada: ';
        if (prev.estado !== nuevoEstado) cambio += `Estado de ${prev.estado} a ${nuevoEstado}. `;
        if (responsable_uuid !== undefined && prev.responsable_uuid !== responsable_uuid) {
            cambio += 'Responsable cambiado. ';
            if (responsable_uuid && responsable_uuid !== usuario_uuid) {
                await crearNotificacion(responsable_uuid, `Se te asignó la comunicación: "${prev.asunto}".`, 'info', id, 'comunicaciones').catch(() => {});
            }
        }
        await pool.query(
            'INSERT INTO comunicacion_trazabilidad (comunicacion_id, usuario_uuid, comentario) VALUES ($1, $2, $3)',
            [id, usuario_uuid, cambio]
        );
        res.json({ message: 'Comunicación actualizada.' });
    } catch (error) {
        logger.error('actualizarComunicacion error', { error: error.message });
        res.status(500).json({ error: 'Error al actualizar.' });
    }
};

export const archivarComunicacion = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario_uuid = req.user.id;
        await pool.query('UPDATE comunicaciones SET is_active = false WHERE id = $1', [id]);
        await pool.query(
            'INSERT INTO comunicacion_trazabilidad (comunicacion_id, usuario_uuid, comentario) VALUES ($1, $2, $3)',
            [id, usuario_uuid, 'Comunicación archivada.']
        );
        res.json({ message: 'Comunicación archivada.' });
    } catch (error) {
        logger.error('archivarComunicacion error', { error: error.message });
        res.status(500).json({ error: 'Error al archivar.' });
    }
};

export const recuperarComunicacion = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario_uuid = req.user.id;
        await pool.query("UPDATE comunicaciones SET is_active = true, estado = 'pendiente' WHERE id = $1", [id]);
        await pool.query(
            'INSERT INTO comunicacion_trazabilidad (comunicacion_id, usuario_uuid, comentario) VALUES ($1, $2, $3)',
            [id, usuario_uuid, 'Comunicación recuperada y marcada como pendiente.']
        );
        res.json({ message: 'Comunicación recuperada.' });
    } catch (error) {
        logger.error('recuperarComunicacion error', { error: error.message });
        res.status(500).json({ error: 'Error al recuperar.' });
    }
};

export const marcarComoRespondida = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario_uuid = req.user.id;
        await pool.query("UPDATE comunicaciones SET estado = 'respondida', is_active = false WHERE id = $1", [id]);
        await pool.query(
            'INSERT INTO comunicacion_trazabilidad (comunicacion_id, usuario_uuid, comentario) VALUES ($1, $2, $3)',
            [id, usuario_uuid, 'Comunicación marcada como respondida y archivada automáticamente.']
        );
        res.json({ message: 'Comunicación marcada como respondida.' });
    } catch (error) {
        logger.error('marcarComoRespondida error', { error: error.message });
        res.status(500).json({ error: 'Error al marcar como respondida.' });
    }
};

export const eliminarComunicacion = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE comunicaciones SET is_active = false WHERE id = $1', [id]);
        res.json({ message: 'Comunicación eliminada.' });
    } catch (error) {
        logger.error('eliminarComunicacion error', { error: error.message });
        res.status(500).json({ error: 'Error al eliminar.' });
    }
};

export const agregarComentario = async (req, res) => {
    try {
        const { id } = req.params;
        const { comentario } = req.body;
        const usuario_uuid = req.user.id;
        await pool.query(
            'INSERT INTO comunicacion_trazabilidad (comunicacion_id, usuario_uuid, comentario) VALUES ($1, $2, $3)',
            [id, usuario_uuid, comentario]
        );
        res.status(201).json({ message: 'Comentario añadido.' });
    } catch (error) {
        logger.error('agregarComentario error', { error: error.message });
        res.status(500).json({ error: 'Error al añadir comentario.' });
    }
};

export const listarComentarios = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT t.*, gu.nombre as autor
            FROM comunicacion_trazabilidad t
            JOIN global_usuarios gu ON t.usuario_uuid = gu.id
            WHERE t.comunicacion_id = $1
            ORDER BY t.fecha DESC
        `;
        const { rows } = await pool.query(query, [id]);
        res.json(rows);
    } catch (error) {
        logger.error('listarComentarios error', { error: error.message });
        res.status(500).json({ error: 'Error al listar comentarios.' });
    }
};

export const obtenerEstadisticas = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, entidad_id, grupo_id, responsable_uuid } = req.query;
        let whereClauses = ['1=1'];
        let params = [];
        let joinQuery = '';

        if (fecha_inicio) { params.push(fecha_inicio); whereClauses.push(`c.fecha_recepcion >= $${params.length}`); }
        if (fecha_fin) { params.push(fecha_fin); whereClauses.push(`c.fecha_recepcion <= $${params.length}`); }
        if (entidad_id) { params.push(entidad_id); whereClauses.push(`c.entidad_id = $${params.length}`); }
        if (grupo_id) {
            params.push(grupo_id);
            joinQuery = 'JOIN comunicacion_grupos cg ON c.id = cg.comunicacion_id';
            whereClauses.push(`cg.grupo_id = $${params.length}`);
        }
        if (responsable_uuid) { params.push(responsable_uuid); whereClauses.push(`c.responsable_uuid = $${params.length}`); }

        const whereSQL = `WHERE ${whereClauses.join(' AND ')}`;

        const kpisQuery = `
            SELECT
                COUNT(DISTINCT c.id) as total,
                SUM(CASE WHEN c.estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
                SUM(CASE WHEN c.estado = 'respondida' THEN 1 ELSE 0 END) as respondidas,
                SUM(CASE WHEN c.fecha_limite < CURRENT_TIMESTAMP AND c.estado != 'respondida' THEN 1 ELSE 0 END) as vencidas,
                (SELECT ge.nombre FROM global_entidades ge JOIN comunicaciones c2 ON ge.id = c2.entidad_id WHERE c2.is_active = true GROUP BY ge.nombre ORDER BY COUNT(*) DESC LIMIT 1) as entidad_mas_activa
            FROM comunicaciones c ${joinQuery} ${whereSQL}
        `;
        const volumenEntidadQuery = `
            SELECT ge.nombre, COUNT(c.id) as total
            FROM comunicaciones c
            JOIN global_entidades ge ON c.entidad_id = ge.id ${joinQuery}
            ${whereSQL}
            GROUP BY ge.nombre
            ORDER BY total DESC
            LIMIT 5
        `;
        const tendenciaQuery = `
            SELECT TO_CHAR(c.fecha_recepcion, 'YYYY-MM') as mes,
            SUM(CASE WHEN c.tipo = 'recibida' THEN 1 ELSE 0 END) as recibidas,
            SUM(CASE WHEN c.tipo = 'enviada' THEN 1 ELSE 0 END) as enviadas
            FROM comunicaciones c ${joinQuery}
            ${whereSQL}
            GROUP BY mes
            ORDER BY mes ASC
        `;

        const [kpis, volumen, tendencia] = await Promise.all([
            pool.query(kpisQuery, params),
            pool.query(volumenEntidadQuery, params),
            pool.query(tendenciaQuery, params),
        ]);

        res.json({
            kpis: kpis.rows[0],
            volumenPorEntidad: volumen.rows,
            tendencia: tendencia.rows,
        });
    } catch (error) {
        logger.error('obtenerEstadisticas error', { error: error.message });
        res.status(500).json({ error: 'Error al obtener estadísticas.' });
    }
};
