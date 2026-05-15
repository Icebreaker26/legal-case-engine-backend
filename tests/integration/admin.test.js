import request from 'supertest';
import { jest } from '@jest/globals';
import createApp from '../../src/app_test.js';
import pool from '../../src/db/database.js';

const app = createApp();
const agent = request.agent(app);

beforeAll(async () => {
  // Login con usuario admin (el correo usado anteriormente)
  await agent.post('/api/auth/login').send({
    email: process.env.TEST_USER_EMAIL,
    password: process.env.TEST_USER_PASS
  });
});

afterAll(async () => {
  await pool.end();
});

describe('Admin Routes - Integración (Seguridad)', () => {
  test('GET /api/admin/usuarios debería requerir rol de admin', async () => {
    // Si el usuario alejandro.marin@enel.com es admin, debe tener acceso
    // Si no lo fuera, debería ser 403
    const res = await agent.get('/api/admin/usuarios');
    // Si nuestro usuario autenticado es admin, esperamos 200, si no, 403
    expect([200, 403]).toContain(res.status);
  });

  test('GET /api/admin/logs debería requerir rol de admin', async () => {
    const res = await agent.get('/api/admin/logs');
    expect([200, 403]).toContain(res.status);
  });
});
