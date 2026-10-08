import cron from 'node-cron';
import pool from '../../../db/database.js';
import logger from '../../../utils/logger.js';
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

// #163: clave de system_config donde se persiste la fecha (Bogotá,
// YYYY-MM-DD) de la última corrida de ejecutarAlertasVencimiento que llegó
// al final sin lanzar -- incluye el caso "no había nada que notificar hoy",
// que también es una corrida exitosa. Sin esto, un redeploy de Railway
// justo antes/durante las 7am se come el cron de ese día sin dejar rastro.
const CONFIG_KEY_ULTIMA_CORRIDA = 'tutelas.alertas_vencimiento.ultima_corrida';

// La alerta de "vence mañana" es sensible a la fecha: si se salta un día
// completo, al día siguiente esa tutela ya muestra "vence hoy" -- por eso
// vale la pena el catch-up cualquier momento del mismo día calendario
// (Bogotá), no solo justo después de las 7am. ejecutarAlertasVencimiento ya
// es idempotente por tutela (WHERE ultima_notif_vencimiento < CURRENT_DATE),
// así que correrla de nuevo el mismo día nunca duplica notificaciones.
// `ahora` es inyectable (default: reloj real) solo para que los tests de
// recuperarAlertasPerdidas sean deterministas -- en producción siempre se
// llama sin argumento.
const hoyBogota = (ahora = new Date()) => ahora.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

const horaBogota = (ahora = new Date()) => Number(
  new Intl.DateTimeFormat('en-US', { timeZone: 'America/Bogota', hour: '2-digit', hour12: false }).format(ahora)
);

const registrarCorridaExitosa = async (fecha) => {
  await pool.query(
    `INSERT INTO system_config (key, value, description)
     VALUES ($1, $2::jsonb, 'Última corrida exitosa de ejecutarAlertasVencimiento (#163) -- incluye corridas sin tutelas que notificar.')
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
    [CONFIG_KEY_ULTIMA_CORRIDA, JSON.stringify({ fecha, ejecutado_en: new Date().toISOString() })],
  );
};

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

    if (rows.length === 0) {
      await registrarCorridaExitosa(hoyBogota());
      return;
    }

    // #141: cada tutela se procesa en su propio try/catch -- antes, un solo
    // fallo (ej. timeout de red en `crearNotificacion` o en el UPDATE) a
    // mitad de la lista abortaba la función completa, y las tutelas
    // restantes de esa corrida no recibían notificación ese día, sin
    // reintento ni rastro más allá de un console.error.
    let enviadas = 0;
    let fallidas = 0;

    for (const tutela of rows) {
      try {
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
        enviadas++;
      } catch (errorTutela) {
        fallidas++;
        logger.error('Error enviando alerta de vencimiento para una tutela individual', {
          tutelaId: tutela.id,
          radicado: tutela.radicado,
          error: errorTutela.message,
        });
        // No relanza: continúa con las demás tutelas del lote.
      }
    }

    logger.info(`[Alertas] ${enviadas} notificación(es) de vencimiento enviadas, ${fallidas} fallida(s).`);
    // #163: se registra como corrida exitosa aunque haya fallidas puntuales
    // -- fallidas ya quedan en logs/error.log con su propio detalle, y no
    // bloquean que el resto del lote cuente como "el cron corrió hoy".
    await registrarCorridaExitosa(hoyBogota());
  } catch (error) {
    logger.error('[Alertas] Error al ejecutar alertas de vencimiento', { error: error.message });
    // No se registra como corrida exitosa -- un catch-up posterior (mismo
    // día o al reiniciar) debe poder reintentar.
  }
};

// #163: al arrancar el proceso, si la última corrida exitosa registrada no
// es "hoy" (Bogotá) y ya pasaron las 7am, dispara un catch-up inmediato en
// vez de esperar al cron del día siguiente -- cubre el caso de un redeploy
// de Railway que se comió la ventana de las 7am. Antes de las 7am no hace
// falta: el cron de ese mismo día todavía no corrió su horario normal.
export const recuperarAlertasPerdidas = async ({ ahora = new Date() } = {}) => {
  try {
    const { rows } = await pool.query(
      "SELECT value FROM system_config WHERE key = $1",
      [CONFIG_KEY_ULTIMA_CORRIDA],
    );
    const ultimaFecha = rows[0]?.value?.fecha ?? null;
    const hoy = hoyBogota(ahora);

    if (ultimaFecha === hoy) {
      logger.info('[Alertas] Catch-up: ya hubo una corrida exitosa hoy, nada que recuperar.');
      return;
    }

    if (horaBogota(ahora) < 7) {
      logger.info('[Alertas] Catch-up: todavía no son las 7am (Bogotá), el cron normal se encarga.');
      return;
    }

    logger.warn(`[Alertas] Catch-up: última corrida exitosa registrada fue ${ultimaFecha ?? 'nunca'}, no hoy (${hoy}) -- probable cron perdido por redeploy. Ejecutando ahora.`);
    await ejecutarAlertasVencimiento();
  } catch (error) {
    logger.error('[Alertas] Error verificando catch-up de alertas de vencimiento', { error: error.message });
  }
};

// Ejecutar todos los días a las 7:00 AM
export const iniciarCronAlertas = () => {
  cron.schedule('0 7 * * *', () => {
    logger.info('[Alertas] Ejecutando verificación de vencimientos...');
    ejecutarAlertasVencimiento();
  }, { timezone: 'America/Bogota' });

  logger.info('[Alertas] Cron de vencimientos activo — se ejecuta diariamente a las 7:00 AM (Bogotá)');

  // #163: catch-up al arrancar -- no bloquea el boot (fire-and-forget), ya
  // tiene su propio try/catch interno.
  recuperarAlertasPerdidas();
};
