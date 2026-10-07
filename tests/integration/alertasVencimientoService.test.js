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

const { ejecutarAlertasVencimiento } = await import('../../src/modules/tutelas/services/alertasVencimientoService.js');

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
