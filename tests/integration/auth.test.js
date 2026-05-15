import request from 'supertest';
import createApp from '../../src/app_test.js';
import pool from '../../src/db/database.js';

const app = createApp();

afterAll(async () => {
  await pool.end();
});

describe('Auth Routes - Integración', () => {
  test('POST /api/auth/login debería responder con error si no hay datos', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect([400, 401, 500]).toContain(res.status);
  });

  test('POST /api/auth/register debería fallar si el email es inválido', async () => {
    const res = await request(app).post('/api/auth/register').send({
      nombre: 'Test',
      email: 'not-an-email',
      password: 'password123'
    });
    expect(res.status).toBe(400);
    // Zod coloca los detalles en 'issues'
    expect(res.body.error[0].message).toContain('Formato de email inválido');
  });

  test('POST /api/auth/register debería fallar si la contraseña es menor a 6 caracteres', async () => {
    const res = await request(app).post('/api/auth/register').send({
      nombre: 'Test',
      email: 'test@enel.com',
      password: '123'
    });
    expect(res.status).toBe(400);
    expect(res.body.error[0].message).toContain('La contraseña debe tener al menos 6 caracteres');
  });

  test('POST /api/auth/login con credenciales inexistentes debería retornar error', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'inexistente@test.com',
      password: 'wrongpassword'
    });
    // Se espera 401 Unauthorized
    expect(res.status).toBe(401);
  });
});
