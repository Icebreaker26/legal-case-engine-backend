import fc from 'fast-check';
import request from 'supertest';
import createApp from '../../src/app_test.js';
import pool from '../../src/db/database.js';

const app = createApp();

afterAll(async () => {
  await pool.end();
});

describe('Fuzz Testing - Endpoint Auth/Login', () => {
  test('Login debe manejar cualquier string aleatorio sin colapsar (500)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.string(),
          password: fc.string()
        }),
        async (payload) => {
          const res = await request(app).post('/api/auth/login').send(payload);
          expect(res.status).not.toBe(500);
        }
      ),
      { numRuns: 50 } // Ejecuta 50 variaciones aleatorias
    );
  });
});
