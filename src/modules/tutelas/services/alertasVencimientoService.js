import cron from 'node-cron';
import pool from '../../../db/database.js';
import { crearNotificacion } from '../../notificaciones/services/notificationService.js';

const UMBRALES = [
  { dias: 0, mensaje: (r, d) => `🚨 VENCIDA: La tutela ${r} venció hoy. Requiere atención inmediata.` },
  { dias: 1, mensaje: (r, d) => `⚠️ URGENTE: La tutela ${r} vence mañana (${d}).` },
  // Faltaba el umbral de 2 días — sin él, una tutela que vence pasado mañana
  // caía al fallback de "vence en 3 días", dándole al abogado un día de
  // margen falso. Ver #141.
  { dias: 2, mensaje: (r, d) => `📅 Recordatorio: La tutela ${r} vence en 2 días (${d}).` },
  { dias: 3, mensaje: (r, d) => `📅 Recordatorio: La tutela ${r} vence en 3 días (${d}).` },
];

export const ejecutarAlertasVencimiento = async () => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const { rows } = await pool.query(`
      SELECT
        t.id,
        t.radicado,
        t.fecha_vencimiento,
        t.responsable_uuid,
        t.ultima_notif_vencimiento,
        CEIL(EXTRACT(EPOCH FROM (t.fecha_vencimiento::timestamptz - NOW())) / 86400) AS dias_restantes
      FROM tutelas t
      WHERE t.is_active = TRUE
        AND t.estado != 'Respondida'
        AND t.responsable_uuid IS NOT NULL
        AND t.fecha_vencimiento IS NOT NULL
        AND CEIL(EXTRACT(EPOCH FROM (t.fecha_vencimiento::timestamptz - NOW())) / 86400) <= 3
        AND (t.ultima_notif_vencimiento IS NULL OR t.ultima_notif_vencimiento < CURRENT_DATE)
    `);

    if (rows.length === 0) return;

    for (const tutela of rows) {
      const dias = parseInt(tutela.dias_restantes);
      const umbral = UMBRALES.find(u => u.dias === Math.max(dias, 0)) || UMBRALES[UMBRALES.length - 1];
      const fechaStr = new Date(tutela.fecha_vencimiento).toLocaleDateString('es-CO', {
        day: '2-digit', month: 'long', year: 'numeric'
      });

      await crearNotificacion(
        tutela.responsable_uuid,
        umbral.mensaje(tutela.radicado, fechaStr),
        'vencimiento',
        tutela.id
      );

      await pool.query(
        `UPDATE tutelas SET ultima_notif_vencimiento = CURRENT_DATE WHERE id = $1`,
        [tutela.id]
      );
    }

    console.log(`[Alertas] ${rows.length} notificación(es) de vencimiento enviadas.`);
  } catch (error) {
    console.error('[Alertas] Error al ejecutar alertas de vencimiento:', error);
  }
};

// Ejecutar todos los días a las 7:00 AM
export const iniciarCronAlertas = () => {
  cron.schedule('0 7 * * *', () => {
    console.log('[Alertas] Ejecutando verificación de vencimientos...');
    ejecutarAlertasVencimiento();
  }, { timezone: 'America/Bogota' });

  console.log('[Alertas] Cron de vencimientos activo — se ejecuta diariamente a las 7:00 AM (Bogotá)');
};
