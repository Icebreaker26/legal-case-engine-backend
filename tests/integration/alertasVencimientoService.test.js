/**
 * Tests de integración — alertasVencimientoService (auditoría #141)
 *
 * Verifica que un fallo al notificar UNA tutela no aborte el procesamiento
 * de las demás del mismo lote (antes del fix, todo el for estaba dentro de
 * un único try/catch y un fallo a mitad de la lista detenía la función
 * completa).
 */
import { jest } from '@jest/globals';
import pool from '../../src/db/database.js';

const crearNotificacionMock = jest.fn();

jest.unstable_mockModule('../../src/modules/notificaciones/services/notificationService.js', () => ({
  crearNotificacion: crearNotificacionMock,
}));

const { ejecutarAlertasVencimiento, recuperarAlertasPerdidas } = await import('../../src/modules/tutelas/services/alertasVencimientoService.js');

const CONFIG_KEY = 'tutelas.alertas_vencimiento.ultima_corrida';

describe('alertasVencimientoService — ejecutarAlertasVencimiento (#141)', () => {
  let usuarioUuid;
  const tutelaIds = [];

  beforeAll(async () => {
    const { rows: [usuario] } = await pool.query(
      `INSERT INTO global_usuarios (nombre, email, password_hash, rol, is_approved)
       VALUES ('TestAlertas141', 'alertas141-test@icebreaker.com', 'x', 'juridico', true)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`
    );
    usuarioUuid = usuario.id;
  });

  afterAll(async () => {
    if (tutelaIds.length) await pool.query('DELETE FROM tutelas WHERE id = ANY($1::uuid[])', [tutelaIds]);
    await pool.query('DELETE FROM global_usuarios WHERE id = $1', [usuarioUuid]);
  });

  beforeEach(() => {
    crearNotificacionMock.mockReset();
  });

  async function crearTutelaPorVencer(radicado, diasParaVencer) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + diasParaVencer);
    const { rows: [t] } = await pool.query(
      `INSERT INTO tutelas (radicado, accionante, juzgado, derecho_vulnerado, contenido_original, fecha_recepcion, estado, is_active, responsable_uuid, fecha_vencimiento)
       VALUES ($1, 'Test', 'Juzgado Test', 'Test', 'texto', NOW(), 'Pendiente', true, $2, $3)
       RETURNING id`,
      [radicado, usuarioUuid, fecha]
    );
    tutelaIds.push(t.id);
    return t.id;
  }

  test('un fallo en una tutela no impide que las demás del lote se notifiquen y marquen', async () => {
    const idFalla = await crearTutelaPorVencer('TEST141-FALLA', 1);
    const idOk1 = await crearTutelaPorVencer('TEST141-OK1', 1);
    const idOk2 = await crearTutelaPorVencer('TEST141-OK2', 0);

    crearNotificacionMock.mockImplementation(async (usuarioUuidArg, mensaje, tipo, referenciaUuid) => {
      if (referenciaUuid === idFalla) throw new Error('fallo simulado de red');
      return { id: 'notif-fake' };
    });

    await ejecutarAlertasVencimiento();

    // No se asume aislamiento total de logs_sistema/tutelas entre archivos de
    // test (otras suites pueden crear tutelas por vencer) -- se verifica
    // solo que SE INTENTÓ notificar las 3 propias, incluida la que falla.
    const idsLlamados = crearNotificacionMock.mock.calls.map(call => call[3]);
    expect(idsLlamados).toEqual(expect.arrayContaining([idFalla, idOk1, idOk2]));

    const { rows } = await pool.query(
      'SELECT id, ultima_notif_vencimiento FROM tutelas WHERE id = ANY($1::uuid[])',
      [[idFalla, idOk1, idOk2]]
    );
    const porId = Object.fromEntries(rows.map(r => [r.id, r.ultima_notif_vencimiento]));

    expect(porId[idFalla]).toBeNull(); // la que falló no se marca como notificada
    expect(porId[idOk1]).not.toBeNull(); // las demás SÍ, a pesar del fallo de la otra
    expect(porId[idOk2]).not.toBeNull();
  });
});

describe('alertasVencimientoService — recuperación tras redeploy (#163)', () => {
  let usuarioUuid;
  const tutelaIds = [];

  beforeAll(async () => {
    const { rows: [usuario] } = await pool.query(
      `INSERT INTO global_usuarios (nombre, email, password_hash, rol, is_approved)
       VALUES ('TestAlertas163', 'alertas163-test@icebreaker.com', 'x', 'juridico', true)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`
    );
    usuarioUuid = usuario.id;
  });

  afterAll(async () => {
    if (tutelaIds.length) await pool.query('DELETE FROM tutelas WHERE id = ANY($1::uuid[])', [tutelaIds]);
    await pool.query('DELETE FROM global_usuarios WHERE id = $1', [usuarioUuid]);
  });

  afterEach(async () => {
    await pool.query('DELETE FROM system_config WHERE key = $1', [CONFIG_KEY]);
  });

  async function crearTutelaPorVencer(radicado, diasParaVencer) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + diasParaVencer);
    const { rows: [t] } = await pool.query(
      `INSERT INTO tutelas (radicado, accionante, juzgado, derecho_vulnerado, contenido_original, fecha_recepcion, estado, is_active, responsable_uuid, fecha_vencimiento)
       VALUES ($1, 'Test', 'Juzgado Test', 'Test', 'texto', NOW(), 'Pendiente', true, $2, $3)
       RETURNING id`,
      [radicado, usuarioUuid, fecha]
    );
    tutelaIds.push(t.id);
    return t.id;
  }

  test('ejecutarAlertasVencimiento registra la corrida exitosa en system_config, incluso sin tutelas que notificar', async () => {
    await ejecutarAlertasVencimiento();

    const { rows } = await pool.query('SELECT value FROM system_config WHERE key = $1', [CONFIG_KEY]);
    expect(rows).toHaveLength(1);
    expect(rows[0].value).toHaveProperty('fecha');
    expect(rows[0].value).toHaveProperty('ejecutado_en');
  });

  test('recuperarAlertasPerdidas no reintenta si ya hubo una corrida exitosa hoy', async () => {
    const hoyBogota = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    await pool.query(
      `INSERT INTO system_config (key, value, description) VALUES ($1, $2::jsonb, 'test #163')
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [CONFIG_KEY, JSON.stringify({ fecha: hoyBogota, ejecutado_en: new Date().toISOString() })],
    );
    crearNotificacionMock.mockReset();

    await recuperarAlertasPerdidas();

    expect(crearNotificacionMock).not.toHaveBeenCalled();
  });

  test('recuperarAlertasPerdidas no hace catch-up antes de las 7am (Bogotá) aunque no haya corrida previa', async () => {
    crearNotificacionMock.mockReset();
    // 2026-01-01 03:00 America/Bogota (UTC-5, sin horario de verano) == 08:00 UTC
    const antesDeLas7 = new Date('2026-01-01T08:00:00.000Z');

    await recuperarAlertasPerdidas({ ahora: antesDeLas7 });

    const { rows } = await pool.query('SELECT value FROM system_config WHERE key = $1', [CONFIG_KEY]);
    expect(rows).toHaveLength(0); // no corrió -- nada que registrar todavía
  });

  test('recuperarAlertasPerdidas hace catch-up si no hubo corrida hoy y ya son las 7am o más (Bogotá)', async () => {
    const idOk = await crearTutelaPorVencer('TEST163-CATCHUP', 1);
    crearNotificacionMock.mockReset();
    crearNotificacionMock.mockResolvedValue({ id: 'notif-fake' });
    // 2026-01-01 09:00 America/Bogota == 14:00 UTC
    const despuesDeLas7 = new Date('2026-01-01T14:00:00.000Z');

    await recuperarAlertasPerdidas({ ahora: despuesDeLas7 });

    const idsLlamados = crearNotificacionMock.mock.calls.map(call => call[3]);
    expect(idsLlamados).toContain(idOk);

    const { rows } = await pool.query('SELECT value FROM system_config WHERE key = $1', [CONFIG_KEY]);
    expect(rows).toHaveLength(1); // ejecutarAlertasVencimiento sí registró su propia corrida (con la fecha real de hoy, no la inyectada)
  });
});
