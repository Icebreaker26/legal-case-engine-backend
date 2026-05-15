import { jest } from '@jest/globals';
import request from 'supertest';
import pool from '../../src/db/database.js';

// Mockeamos aiService antes de cualquier otra importación de rutas
jest.unstable_mockModule('../../src/services/aiService.js', () => ({
  generarEmbeddingLocal: jest.fn().mockResolvedValue(new Array(384).fill(0.1))
}));

const { default: createApp } = await import('../../src/app_test.js');

const app = createApp();
const agent = request.agent(app);

beforeAll(async () => {
  await agent.post('/api/auth/login').send({
    email: 'alejandro.marin@enel.com',
    password: '123456'
  });
});

afterAll(async () => {
  await pool.end();
});

describe('Memoria (Base de Conocimiento) - Integración', () => {
  test('POST /api/tutelas/entrenar-local debería persistir el conocimiento', async () => {
    const payload = {
      categoria: 'TEST_CAT',
      contenido_legal: 'Este es un contenido de prueba para la memoria legal.',
      titulo_referencia: 'Doc de Prueba'
    };

    const res = await agent
      .post('/api/tutelas/entrenar-local')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.mensaje).toBe('Conocimiento guardado');
  });

  test('GET /api/tutelas/memoria debería listar los documentos activos', async () => {
    const res = await agent.get('/api/tutelas/memoria');
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
