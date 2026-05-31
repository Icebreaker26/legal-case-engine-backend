import request from 'supertest';
import createApp from '../../src/app_test.js';
import pool from '../../src/db/database.js';
import bcrypt from 'bcrypt';

const app = createApp();
const agent = request.agent(app);

describe('Admin Routes - Integración', () => {
  let testUserId;
  const testEmail = 'admin-test@icebreaker.com';
  const testPass = 'testpass123';

  beforeAll(async () => {
    // 1. Crear usuario de prueba (Idempotente)
    const hash = await bcrypt.hash(testPass, 10);
    const userRes = await pool.query(
      'INSERT INTO abogados (nombre, email, password_hash, especialidad, is_approved, is_admin) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash RETURNING id',
      ['Admin Test User', testEmail, hash, 'Testing', true, true]
    );
    testUserId = userRes.rows[0].id;

    // 2. Conceder permisos necesarios para administración
    await pool.query(`
      INSERT INTO permisos (usuario_id, modulo_id, accion_id)
      SELECT $1, m.id, a.id
      FROM modulos m, acciones a
      WHERE m.nombre = 'admin' AND a.nombre IN ('READ', 'WRITE')
      ON CONFLICT DO NOTHING;
    `, [testUserId]);

    // 3. Login
    await agent.post('/api/auth/login').send({
      email: testEmail,
      password: testPass
    });
  });

  afterAll(async () => {
    if (testUserId) {
      await pool.query('DELETE FROM logs_sistema WHERE usuario_id = $1', [testUserId]);
      await pool.query('DELETE FROM permisos WHERE usuario_id = $1', [testUserId]);
      await pool.query('DELETE FROM abogados WHERE id = $1', [testUserId]);
    }
    await pool.end();
  });

  test('GET /api/admin/usuarios debería permitir acceso a admin', async () => {
    const res = await agent.get('/api/admin/usuarios');
    expect(res.status).toBe(200);
  });

  test('GET /api/admin/logs debería permitir acceso a admin', async () => {
    const res = await agent.get('/api/admin/logs');
    expect(res.status).toBe(200);
  });
});
