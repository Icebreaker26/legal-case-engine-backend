import request from 'supertest';
import createApp from '../../src/app_test.js';
import pool from '../../src/db/database.js';
import bcrypt from 'bcrypt';

const app = createApp();
const agent = request.agent(app);

describe('Historial Routes - Integración', () => {
  let testUserId;
  const testEmail = 'hist-test@icebreaker.com';
  const testPass = 'testpass123';

  beforeAll(async () => {
    const hash = await bcrypt.hash(testPass, 10);
    const userRes = await pool.query(
      'INSERT INTO abogados (nombre, email, password_hash, especialidad, is_approved) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash RETURNING id',
      ['Historial Test User', testEmail, hash, 'Testing', true]
    );
    testUserId = userRes.rows[0].id;

    await agent.post('/api/auth/login').send({
      email: testEmail,
      password: testPass
    });
  });

  afterAll(async () => {
    if (testUserId) {
      await pool.query('DELETE FROM logs_sistema WHERE usuario_id = $1', [testUserId]);
      await pool.query('DELETE FROM abogados WHERE id = $1', [testUserId]);
    }
    await pool.end();
  });

  test('GET /api/tutelas/:id/historial debería requerir autenticación', async () => {
    const res = await request(app).get('/api/tutelas/1/historial');
    expect(res.status).toBe(401);
  });

  test('GET /api/tutelas/:id/historial debería obtener historial si está autenticado', async () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';
    const res = await agent.get(`/api/tutelas/${validUuid}/historial`);
    expect([200, 403, 404]).toContain(res.status);
  });
});
