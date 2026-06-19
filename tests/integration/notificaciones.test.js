import request from 'supertest';
import createApp from '../../src/app_test.js';
import pool from '../../src/db/database.js';
import bcrypt from 'bcrypt';

const app = createApp();
const agent = request.agent(app);

describe('Notificaciones — Integración', () => {
  let testUserUuid;
  let notifId;

  const testEmail = 'notif-test@icebreaker.com';
  const testPass  = 'testpass123';

  beforeAll(async () => {
    const hash = await bcrypt.hash(testPass, 10);
    const { rows } = await pool.query(
      `INSERT INTO global_usuarios (nombre, email, password_hash, rol, is_approved)
       VALUES ($1, $2, $3, 'juridico', true)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      ['Notif Test', testEmail, hash]
    );
    testUserUuid = rows[0].id;

    // Insertar dos notificaciones de prueba
    const { rows: n1 } = await pool.query(
      `INSERT INTO notificaciones (usuario_uuid, mensaje, tipo, leida)
       VALUES ($1, 'Mensaje de prueba 1', 'info', false) RETURNING id`,
      [testUserUuid]
    );
    notifId = n1[0].id;
    await pool.query(
      `INSERT INTO notificaciones (usuario_uuid, mensaje, tipo, leida)
       VALUES ($1, 'Mensaje de prueba 2', 'info', false)`,
      [testUserUuid]
    );

    await agent.post('/api/auth/login').send({ email: testEmail, password: testPass });
  });

  afterAll(async () => {
    await pool.query('DELETE FROM notificaciones WHERE usuario_uuid = $1', [testUserUuid]);
    await pool.query('DELETE FROM logs_sistema WHERE usuario_uuid = $1', [testUserUuid]);
    await pool.query('DELETE FROM global_usuarios WHERE id = $1', [testUserUuid]);
    await pool.end();
  });

  test('Rechaza sin token', async () => {
    const res = await request(app).get('/api/notificaciones');
    expect(res.status).toBe(401);
  });

  test('GET / — lista notificaciones del usuario', async () => {
    const res = await agent.get('/api/notificaciones');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body.every(n => n.usuario_uuid === testUserUuid)).toBe(true);
  });

  test('PATCH /:id/leida — marca una como leída', async () => {
    const res = await agent.patch(`/api/notificaciones/${notifId}/leida`);
    expect(res.status).toBe(200);
    const { rows } = await pool.query('SELECT leida FROM notificaciones WHERE id = $1', [notifId]);
    expect(rows[0].leida).toBe(true);
  });

  test('PATCH /todas/leidas — marca todas como leídas', async () => {
    const res = await agent.patch('/api/notificaciones/todas/leidas');
    expect(res.status).toBe(200);
    const { rows } = await pool.query(
      'SELECT COUNT(*) as pendientes FROM notificaciones WHERE usuario_uuid = $1 AND leida = false',
      [testUserUuid]
    );
    expect(Number(rows[0].pendientes)).toBe(0);
  });

  test('DELETE /leidas/limpiar — elimina las notificaciones leídas', async () => {
    const res = await agent.delete('/api/notificaciones/leidas/limpiar');
    expect(res.status).toBe(200);
    const { rows } = await pool.query(
      'SELECT COUNT(*) as total FROM notificaciones WHERE usuario_uuid = $1 AND leida = true',
      [testUserUuid]
    );
    expect(Number(rows[0].total)).toBe(0);
  });

  test('DELETE /:id — elimina una notificación específica', async () => {
    const { rows } = await pool.query(
      `INSERT INTO notificaciones (usuario_uuid, mensaje, tipo, leida)
       VALUES ($1, 'Para borrar', 'info', false) RETURNING id`,
      [testUserUuid]
    );
    const tempId = rows[0].id;

    const res = await agent.delete(`/api/notificaciones/${tempId}`);
    expect(res.status).toBe(200);
    const { rows: check } = await pool.query('SELECT id FROM notificaciones WHERE id = $1', [tempId]);
    expect(check.length).toBe(0);
  });
});
