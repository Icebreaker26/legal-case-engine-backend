import request from 'supertest';
import createApp from '../../src/app_test.js';
import pool from '../../src/db/database.js';
import bcrypt from 'bcrypt';

const app = createApp();
const agent = request.agent(app);

describe('Tutela Routes - Integración', () => {
  let testUserId;
  const testEmail = 'tutelas-test@icebreaker.com';
  const testPass = 'testpass123';

  beforeAll(async () => {
    // 1. Crear usuario de prueba (Idempotente)
    const hash = await bcrypt.hash(testPass, 10);
    const userRes = await pool.query(
      'INSERT INTO abogados (nombre, email, password_hash, especialidad, is_approved) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash RETURNING id',
      ['Tutelas Test User', testEmail, hash, 'Testing', true]
    );
    testUserId = userRes.rows[0].id;

    // 2. Conceder permisos necesarios
    await pool.query(`
      INSERT INTO permisos (usuario_id, modulo_id, accion_id)
      SELECT $1, m.id, a.id
      FROM modulos m, acciones a
      WHERE m.nombre = 'tutelas' AND a.nombre IN ('READ', 'WRITE')
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

  test('GET /api/tutelas debería responder 401 si no hay token', async () => {
    const res = await request(app).get('/api/tutelas');
    expect(res.status).toBe(401);
  });

  test('POST /api/tutelas/procesar debería aceptar un archivo (autenticado)', async () => {
    const res = await agent
      .post('/api/tutelas/procesar')
      .attach('documento', Buffer.from('Contenido de prueba de documento'), 'test.pdf');
    
    // Debería pasar la autorización (no ser 401 ni 403)
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
});
