import request from 'supertest';
import createApp from '../../src/app_test.js';
import pool from '../../src/db/database.js';
import bcrypt from 'bcrypt';

const app = createApp();
const agent = request.agent(app);

describe('Admin Routes - Integración', () => {
  let testUserUuid; // Cambiado a UUID
  const testEmail = 'admin-test@icebreaker.com';
  const testPass = 'testpass123';

  beforeAll(async () => {
    // 1. Crear usuario de prueba en global_usuarios (Idempotente)
    const hash = await bcrypt.hash(testPass, 10);
    const userRes = await pool.query(
      'INSERT INTO global_usuarios (nombre, email, password_hash, rol, is_admin, is_approved) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash RETURNING id',
      ['Admin Test User', testEmail, hash, 'admin', true, true]
    );
    testUserUuid = userRes.rows[0].id; // UUID

    // 2. Conceder permisos necesarios para administración (Usando UUID)
    await pool.query(`
      INSERT INTO permisos (usuario_uuid, modulo_id, accion_id)
      SELECT $1, m.id, a.id
      FROM modulos m, acciones a
      WHERE m.nombre = 'admin' AND a.nombre IN ('READ', 'WRITE')
      ON CONFLICT DO NOTHING;
    `, [testUserUuid]);

    // 3. Login
    await agent.post('/api/auth/login').send({
      email: testEmail,
      password: testPass
    });
  });

  afterAll(async () => {
    if (testUserUuid) {
      await pool.query('DELETE FROM logs_sistema WHERE usuario_uuid = $1', [testUserUuid]);
      await pool.query('DELETE FROM permisos WHERE usuario_uuid = $1', [testUserUuid]);
      await pool.query('DELETE FROM global_usuarios WHERE id = $1', [testUserUuid]);
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
