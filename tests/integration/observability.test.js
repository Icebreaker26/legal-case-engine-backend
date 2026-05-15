import request from 'supertest';
import createApp from '../../src/app_test.js';
import pool from '../../src/db/database.js';

const app = createApp();

afterAll(async () => {
  await pool.end();
});

describe('Observabilidad - Integración', () => {
  test('Cada respuesta debe incluir un X-Request-Id único', async () => {
    const res = await request(app).get('/api/auth/login');
    
    expect(res.headers).toHaveProperty('x-request-id');
    const requestId = res.headers['x-request-id'];
    
    // Verificar que parece un UUID
    expect(requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });
});
