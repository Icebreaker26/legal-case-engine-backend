import { jest } from '@jest/globals';
import request from 'supertest';
import pool from '../../src/db/database.js';
import bcrypt from 'bcrypt';

// Mockeamos aiService antes de cualquier otra importación de rutas
jest.unstable_mockModule('../../src/modules/tutelas/services/aiService.js', () => ({
  generarEmbeddingLocal: jest.fn().mockResolvedValue(new Array(384).fill(0.1)),
  generarEmbedding: jest.fn().mockResolvedValue(new Array(384).fill(0.1)),
}));

const { default: createApp } = await import('../../src/app_test.js');

const app = createApp();
const agent = request.agent(app);

describe('Memoria (Base de Conocimiento) - Integración', () => {
  let testUserUuid; // Cambiado a UUID
  const testEmail = 'mem-test@icebreaker.com';
  const testPass = 'testpass123';

  beforeAll(async () => {
    // 1. Crear usuario de prueba en global_usuarios (Idempotente)
    const hash = await bcrypt.hash(testPass, 10);
    const userRes = await pool.query(
      'INSERT INTO global_usuarios (nombre, email, password_hash, rol, is_approved) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash RETURNING id',
      ['Memoria Test User', testEmail, hash, 'juridico', true]
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
