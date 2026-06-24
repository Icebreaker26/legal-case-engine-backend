import request from 'supertest';
import createApp from '../../src/app_test.js';
import pool from '../../src/db/database.js';
import bcrypt from 'bcrypt';

const app = createApp();
const agent = request.agent(app);

describe('Analytics — Integración', () => {
  let testUserUuid;

  const testEmail = 'analytics-test@icebreaker.com';
  const testPass  = 'testpass123';

  beforeAll(async () => {
    const hash = await bcrypt.hash(testPass, 10);
    const { rows } = await pool.query(
      `INSERT INTO global_usuarios (nombre, email, password_hash, rol, is_approved)
       VALUES ($1, $2, $3, 'juridico', true)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      ['Analytics Test', testEmail, hash]
    );
    testUserUuid = rows[0].id;

    await pool.query(`
      INSERT INTO permisos (usuario_uuid, modulo_id, accion_id)
      SELECT $1, m.id, a.id FROM modulos m, acciones a
      WHERE m.nombre = 'tutelas' AND a.nombre = 'READ'
      ON CONFLICT DO NOTHING
    `, [testUserUuid]);

    await agent.post('/api/auth/login').send({ email: testEmail, password: testPass });
  });

  afterAll(async () => {
    await pool.query('DELETE FROM logs_sistema WHERE usuario_uuid = $1', [testUserUuid]);
    await pool.query('DELETE FROM permisos WHERE usuario_uuid = $1', [testUserUuid]);
    await pool.query('DELETE FROM global_usuarios WHERE id = $1', [testUserUuid]);
    await pool.end();
  });

  test('Rechaza sin token', async () => {
    const res = await request(app).get('/api/analytics/score-riesgo');
    expect(res.status).toBe(401);
  });

  test('GET /score-riesgo — devuelve array con scores', async () => {
    const res = await agent.get('/api/analytics/score-riesgo');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Si hay tutelas, cada item debe tener score y nivel
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('score');
      expect(res.body[0]).toHaveProperty('nivel');
      expect(['Alto', 'Medio', 'Bajo']).toContain(res.body[0].nivel);
    }
  });

  test('GET /patrones-fallo — devuelve estructura con detalle y porDerecho', async () => {
    const res = await agent.get('/api/analytics/patrones-fallo');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('detalle');
    expect(res.body).toHaveProperty('porDerecho');
    expect(res.body).toHaveProperty('porJuzgado');
    expect(Array.isArray(res.body.detalle)).toBe(true);
  });

  test('GET /eficiencia-rag — devuelve resumen y porCategoria', async () => {
    const res = await agent.get('/api/analytics/eficiencia-rag');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('resumen');
    expect(res.body).toHaveProperty('porCategoria');
    expect(res.body).toHaveProperty('top_documentos');
    expect(res.body).toHaveProperty('bottom_documentos');
  });

  test('GET /carga-abogados — devuelve distribución de carga', async () => {
    const res = await agent.get('/api/analytics/carga-abogados');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('casos_activos');
      expect(res.body[0]).toHaveProperty('tasa_cierre');
    }
  });

  test('GET /tiempo-respuesta-area — devuelve métricas por grupo', async () => {
    const res = await agent.get('/api/analytics/tiempo-respuesta-area');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
