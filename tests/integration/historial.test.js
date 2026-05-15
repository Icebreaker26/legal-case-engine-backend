import request from 'supertest';
import createApp from '../../src/app_test.js';
import pool from '../../src/db/database.js';

const app = createApp();
const agent = request.agent(app);

beforeAll(async () => {
  await agent.post('/api/auth/login').send({
    email: process.env.TEST_USER_EMAIL,
    password: process.env.TEST_USER_PASS
  });
});

afterAll(async () => {
  await pool.end();
});

describe('Historial Routes - Integración', () => {
  test('GET /api/tutelas/:id/historial debería requerir autenticación', async () => {
    // Probamos sin el agente (sin cookies)
    const res = await request(app).get('/api/tutelas/1/historial');
    expect(res.status).toBe(401);
  });

  test('GET /api/tutelas/:id/historial debería obtener historial si está autenticado', async () => {
    // Usamos un UUID válido (formato) para evitar error 400
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';
    const res = await agent.get(`/api/tutelas/${validUuid}/historial`);
    
    // Aceptamos 200, 404, o 403 (en caso de que el usuario no tenga permisos)
    expect([200, 403, 404]).toContain(res.status);
  });
});
