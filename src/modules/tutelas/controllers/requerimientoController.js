import pool from '../../../db/database.js';
import { crearNotificacion } from '../../notificaciones/services/notificationService.js';

export const listarRequerimientosPorArea = async (req, res) => {
  try {
    const { area } = req.params;
    const { rows } = await pool.query(
      `SELECT r.*, t.radicado AS tutela_radicado, t.fecha_vencimiento, t.responsable_uuid,
              g.nombre AS area_nombre
       FROM requerimientos_internos r
       JOIN tutelas t ON r.tutela_id = t.id
       JOIN global_grupos g ON r.grupo_id = g.id
       WHERE g.nombre = $1
       ORDER BY
         CASE r.prioridad WHEN 'Alta' THEN 1 WHEN 'Media' THEN 2 ELSE 3 END,
         r.fecha_limite ASC NULLS LAST,
         r.created_at DESC`,
      [area]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en listarRequerimientosPorArea:', error);
    res.status(500).json({ error: 'Error al listar requerimientos por área.' });
  }
};

export const responderRequerimientoPorArea = async (req, res) => {
  try {
    const { reqId } = req.params;
    const { respuesta_texto } = req.body;

    if (!respuesta_texto?.trim()) {
      return res.status(400).json({ error: 'La respuesta no puede estar vacía.' });
    }

    const { rows } = await pool.query(
      `SELECT r.tutela_id, r.grupo_id, t.radicado, t.responsable_uuid, g.nombre AS area_nombre
       FROM requerimientos_internos r
       JOIN tutelas t ON r.tutela_id = t.id
       JOIN global_grupos g ON r.grupo_id = g.id
       WHERE r.id = $1`,
      [reqId]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Requerimiento no encontrado.' });

    const { tutela_id, radicado, responsable_uuid, area_nombre } = rows[0];
    const timestamp = new Date().toLocaleString('es-CO');
    const respuestaFormateada = `\n[${timestamp}]: ${respuesta_texto.trim()}`;

    await pool.query(
      `UPDATE requerimientos_internos
       SET estado = 'Respondido',
           fecha_respuesta = NOW(),
           respuesta_texto = COALESCE(respuesta_texto, '') || $1
       WHERE id = $2`,
      [respuestaFormateada, reqId]
    );

    await pool.query(
      `INSERT INTO historial_acciones (tutela_id, accion, responsable_uuid)
       VALUES ($1, $2, $3)`,
      [
        tutela_id,
        `Respuesta recibida de ${area_nombre}: ${respuesta_texto.trim().substring(0, 200)}`,
        req.user?.id || null,
      ]
    );

    // Notificar al responsable de la tutela
    if (responsable_uuid) {
      await crearNotificacion(
        responsable_uuid,
        `El área ${area_nombre} respondió el requerimiento de la tutela ${radicado}`,
        'requerimiento_respondido',
        tutela_id
      );
    }

    res.json({ message: 'Respuesta registrada correctamente.' });
  } catch (error) {
    console.error('Error en responderRequerimientoPorArea:', error);
    res.status(500).json({ error: 'Error al registrar la respuesta.' });
  }
};
