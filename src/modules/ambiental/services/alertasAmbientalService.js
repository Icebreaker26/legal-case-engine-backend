import cron from 'node-cron';
import pool from '../../../db/database.js';
import { crearNotificacion } from '../../notificaciones/services/notificationService.js';

const UMBRALES_EXPEDIENTE = [
  { dias: 0, msg: (n, f) => `🚨 VENCIDO: El instrumento ambiental "${n}" venció hoy. Requiere atención inmediata.` },
  { dias: 1, msg: (n, f) => `⚠️ URGENTE: El instrumento ambiental "${n}" vence mañana (${f}).` },
  { dias: 3, msg: (n, f) => `📅 Recordatorio: El instrumento ambiental "${n}" vence en 3 días (${f}).` },
  { dias: 5, msg: (n, f) => `🌿 Aviso: El instrumento ambiental "${n}" vence el ${f} (5 días).` },
];

const UMBRALES_PAGO = [
  { dias: 0, msg: (n, v, f) => `🚨 PAGO VENCIDO: El pago de ${v} del expediente "${n}" venció hoy.` },
  { dias: 1, msg: (n, v, f) => `⚠️ PAGO URGENTE: El pago de ${v} del expediente "${n}" vence mañana (${f}).` },
  { dias: 3, msg: (n, v, f) => `💰 Recordatorio de pago: ${v} del expediente "${n}" vence en 3 días (${f}).` },
  { dias: 5, msg: (n, v, f) => `💰 Aviso de pago: ${v} del expediente "${n}" vence el ${f} (5 días).` },
];

const umbralParaDias = (umbrales, dias) =>
  umbrales.find(u => u.dias === Math.max(dias, 0)) || umbrales[umbrales.length - 1];

const formatFecha = (fecha) =>
  new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });

export const ejecutarAlertasAmbiental = async () => {
  try {
    // — Alertas de vencimiento de expedientes —
    const { rows: expedientes } = await pool.query(`
      SELECT
        e.id,
        COALESCE(e.numero_expediente, e.titulo) AS nombre,
        e.fecha_vencimiento,
        e.responsable_uuid,
        e.ultima_notif_vencimiento,
        CEIL(EXTRACT(EPOCH FROM (e.fecha_vencimiento::timestamptz - NOW())) / 86400) AS dias_restantes
      FROM expedientes_ambientales e
      WHERE e.is_active = TRUE
        AND e.estado NOT IN ('Archivado')
        AND e.responsable_uuid IS NOT NULL
        AND e.fecha_vencimiento IS NOT NULL
        AND CEIL(EXTRACT(EPOCH FROM (e.fecha_vencimiento::timestamptz - NOW())) / 86400) <= 5
        AND (e.ultima_notif_vencimiento IS NULL OR e.ultima_notif_vencimiento < CURRENT_DATE)
    `);

    for (const exp of expedientes) {
      const dias = parseInt(exp.dias_restantes);
      const umbral = umbralParaDias(UMBRALES_EXPEDIENTE, dias);
      const fechaStr = formatFecha(exp.fecha_vencimiento);

      await crearNotificacion(
        exp.responsable_uuid,
        umbral.msg(exp.nombre, fechaStr),
        'vencimiento',
        exp.id,
        'ambiental'
      );

      await pool.query(
        `UPDATE expedientes_ambientales SET ultima_notif_vencimiento = CURRENT_DATE WHERE id = $1`,
        [exp.id]
      );
    }

    // — Alertas de vencimiento de pagos pendientes —
    const { rows: pagos } = await pool.query(`
      SELECT
        p.id,
        p.valor,
        p.fecha_vencimiento,
        p.ultima_notif_vencimiento,
        e.responsable_uuid,
        COALESCE(e.numero_expediente, e.titulo) AS expediente_nombre,
        CEIL(EXTRACT(EPOCH FROM (p.fecha_vencimiento::timestamptz - NOW())) / 86400) AS dias_restantes
      FROM pagos_ambientales p
      JOIN expedientes_ambientales e ON e.id = p.expediente_id
      WHERE p.estado = 'Pendiente'
        AND e.is_active = TRUE
        AND e.responsable_uuid IS NOT NULL
        AND p.fecha_vencimiento IS NOT NULL
        AND CEIL(EXTRACT(EPOCH FROM (p.fecha_vencimiento::timestamptz - NOW())) / 86400) <= 5
        AND (p.ultima_notif_vencimiento IS NULL OR p.ultima_notif_vencimiento < CURRENT_DATE)
    `);

    for (const pago of pagos) {
      const dias = parseInt(pago.dias_restantes);
      const umbral = umbralParaDias(UMBRALES_PAGO, dias);
      const fechaStr = formatFecha(pago.fecha_vencimiento);

      await crearNotificacion(
        pago.responsable_uuid,
        umbral.msg(pago.expediente_nombre, pago.valor, fechaStr),
        'pago',
        pago.id,
        'ambiental'
      );

      await pool.query(
        `UPDATE pagos_ambientales SET ultima_notif_vencimiento = CURRENT_DATE WHERE id = $1`,
        [pago.id]
      );
    }

    const total = expedientes.length + pagos.length;
    if (total > 0) {
      console.log(`[Alertas Ambiental] ${expedientes.length} vencimiento(s) y ${pagos.length} pago(s) notificados.`);
    }
  } catch (error) {
    console.error('[Alertas Ambiental] Error:', error);
  }
};

export const iniciarCronAlertasAmbiental = () => {
  cron.schedule('0 7 * * *', () => {
    console.log('[Alertas Ambiental] Verificando vencimientos...');
    ejecutarAlertasAmbiental();
  }, { timezone: 'America/Bogota' });

  console.log('[Alertas Ambiental] Cron activo — diariamente a las 7:00 AM (Bogotá)');
};
