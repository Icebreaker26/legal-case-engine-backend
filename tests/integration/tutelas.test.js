import request from 'supertest';
import createApp from '../../src/app_test.js';
import pool from '../../src/db/database.js';
import bcrypt from 'bcrypt';

const app = createApp();
const agent = request.agent(app);

describe('Tutela Routes - Integración', () => {
  let testUserUuid; // Cambiado a UUID
  const testEmail = 'tutelas-test@icebreaker.com';
  const testPass = 'testpass123';

  beforeAll(async () => {
    // 1. Crear usuario de prueba en global_usuarios (Idempotente)
    const hash = await bcrypt.hash(testPass, 10);
    const userRes = await pool.query(
      'INSERT INTO global_usuarios (nombre, email, password_hash, rol, is_approved) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash RETURNING id',
      ['Tutelas Test User', testEmail, hash, 'juridico', true]
    );
    testUserUuid = userRes.rows[0].id; // UUID

    // 2. Conceder permisos necesarios (Usando UUID)
    await pool.query(`
      INSERT INTO permisos (usuario_uuid, modulo_id, accion_id)
      SELECT $1, m.id, a.id
      FROM modulos m, acciones a
      WHERE m.nombre = 'tutelas' AND a.nombre IN ('READ', 'WRITE')
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
