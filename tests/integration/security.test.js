import request from 'supertest';
import createApp from '../../src/app_test.js';

const app = createApp();

describe('Security Headers - Integración', () => {
  test('La respuesta debe incluir cabeceras de seguridad de Helmet', async () => {
    const res = await request(app).get('/api/auth/login'); // Ruta cualquiera
    
    // Validar cabeceras clave de Helmet
    expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
    expect(res.headers).toHaveProperty('x-frame-options', 'SAMEORIGIN');
    expect(res.headers).toHaveProperty('x-dns-prefetch-control', 'off');
  });
});
