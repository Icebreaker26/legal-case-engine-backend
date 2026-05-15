import request from 'supertest';
import { jest } from '@jest/globals';
import createApp from '../../src/app_test.js';
import pool from '../../src/db/database.js';
import logger from '../../src/utils/logger.js';

const app = createApp();

// Espiamos el logger para verificar que se llame ante errores
jest.spyOn(logger, 'error');

afterAll(async () => {
  await pool.end();
});

describe('Observabilidad - Log de errores', () => {
  test('POST /api/auth/login debería registrar un error en Winston ante fallo interno', async () => {
    // Forzamos un fallo en la DB mockeando el pool para que lance un error
    const spy = jest.spyOn(pool, 'query').mockRejectedValue(new Error('DB connection failed'));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@enel.com', password: 'password' });

    expect(res.status).toBe(500);
    expect(logger.error).toHaveBeenCalled();
    
    // Verificamos que el log contenga el mensaje de error y el requestId
    const logCall = logger.error.mock.calls[0];
    expect(logCall[0]).toContain('Error en login:');
    expect(logCall[1]).toHaveProperty('message', 'DB connection failed');
    expect(logCall[1]).toHaveProperty('requestId');

    spy.mockRestore();
  });
});
