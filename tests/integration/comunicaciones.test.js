import request from 'supertest';
import createApp from '../../src/app_test.js';
import pool from '../../src/db/database.js';
import bcrypt from 'bcrypt';

const app = createApp();
const agent = request.agent(app);

describe('Comunicaciones — Integración', () => {
  let testUserUuid;
  let comunicacionId;
  let entidadId;

  const testEmail = 'comunicaciones-test@icebreaker.com';
  const testPass  = 'testpass123';

  // ── Setup ──────────────────────────────────────────────────────────────────
  beforeAll(async () => {
    const hash = await bcrypt.hash(testPass, 10);
    const { rows } = await pool.query(
      `INSERT INTO global_usuarios (nombre, email, password_hash, rol, is_approved)
       VALUES ($1, $2, $3, 'juridico', true)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      ['Comunicaciones Test', testEmail, hash]
    );
    testUserUuid = rows[0].id;

    await pool.query(`
      INSERT INTO permisos (usuario_uuid, modulo_id, accion_id)
      SELECT $1, m.id, a.id FROM modulos m, acciones a
      WHERE m.nombre = 'comunicaciones' AND a.nombre IN ('READ_COM', 'WRITE_COM', 'DELETE_COM')
      ON CONFLICT DO NOTHING
    `, [testUserUuid]);

    // Entidad de prueba
    const { rows: eRows } = await pool.query(
      `INSERT INTO global_entidades (nombre, is_active)
       VALUES ('Entidad Test CI', true)
       RETURNING id`
    );
    entidadId = eRows[0].id;

    await agent.post('/api/auth/login').send({ email: testEmail, password: testPass });
  });

  // ── Teardown ───────────────────────────────────────────────────────────────
  afterAll(async () => {
    await pool.query('DELETE FROM comunicacion_trazabilidad WHERE comunicacion_id IN (SELECT id FROM comunicaciones WHERE entidad_id = $1)', [entidadId]);
    await pool.query('DELETE FROM comunicacion_grupos WHERE comunicacion_id IN (SELECT id FROM comunicaciones WHERE entidad_id = $1)', [entidadId]);
    await pool.query('DELETE FROM comunicaciones WHERE entidad_id = $1', [entidadId]);
    await pool.query('DELETE FROM global_entidades WHERE id = $1', [entidadId]);
    await pool.query('DELETE FROM logs_sistema WHERE usuario_uuid = $1', [testUserUuid]);
    await pool.query('DELETE FROM permisos WHERE usuario_uuid = $1', [testUserUuid]);
    await pool.query('DELETE FROM global_usuarios WHERE id = $1', [testUserUuid]);
    await pool.end();
  });

  // ── Autenticación ──────────────────────────────────────────────────────────
  describe('Auth', () => {
    test('Debe rechazar peticiones sin token', async () => {
      const res = await request(app).get('/api/comunicaciones');
      expect(res.status).toBe(401);
    });
  });

  // ── CRUD principal ─────────────────────────────────────────────────────────
  describe('CRUD', () => {
    test('POST / — crea comunicación', async () => {
      const res = await agent.post('/api/comunicaciones').send({
        entidad_id: entidadId,
        tipo: 'recibida',
        asunto: 'Oficio de prueba CI',
        fecha_recepcion: '2026-06-01',
        fecha_limite: '2026-06-30',
        responsable_uuid: testUserUuid,
        descripcion: 'Descripción de prueba',
      });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      comunicacionId = res.body.id;
    });

    test('POST / — falla sin campos obligatorios', async () => {
      const res = await agent.post('/api/comunicaciones').send({
        tipo: 'recibida',
        // falta asunto y entidad_id
      });
      expect(res.status).toBe(400);
    });

    test('POST / — falla con tipo inválido', async () => {
      const res = await agent.post('/api/comunicaciones').send({
        entidad_id: entidadId,
        tipo: 'invalido',
        asunto: 'Test',
        fecha_recepcion: '2026-06-01',
      });
      expect(res.status).toBe(400);
    });

    test('GET / — lista comunicaciones', async () => {
      const res = await agent.get('/api/comunicaciones');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some(c => c.id === comunicacionId)).toBe(true);
    });

    test('GET /mis-comunicaciones — lista las del usuario', async () => {
      const res = await agent.get('/api/comunicaciones/mis-comunicaciones');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('PATCH /:id — actualiza campos parcialmente', async () => {
      const res = await agent.patch(`/api/comunicaciones/${comunicacionId}`).send({
        asunto: 'Asunto actualizado CI',
        estado: 'en_proceso',
      });
      expect(res.status).toBe(200);
      const { rows } = await pool.query('SELECT asunto, estado FROM comunicaciones WHERE id = $1', [comunicacionId]);
      expect(rows[0].asunto).toBe('Asunto actualizado CI');
      expect(rows[0].estado).toBe('en_proceso');
    });

    test('PATCH /:id — falla con estado inválido', async () => {
      const res = await agent.patch(`/api/comunicaciones/${comunicacionId}`).send({
        estado: 'no_existe',
      });
      expect(res.status).toBe(400);
    });
  });

  // ── Trazabilidad (comentarios) ─────────────────────────────────────────────
  describe('Comentarios / Trazabilidad', () => {
    test('POST /:id/comentarios — agrega comentario', async () => {
      const res = await agent
        .post(`/api/comunicaciones/${comunicacionId}/comentarios`)
        .send({ comentario: 'Comentario de integración' });
      expect(res.status).toBe(201);
    });

    test('POST /:id/comentarios — falla con cuerpo vacío', async () => {
      const res = await agent
        .post(`/api/comunicaciones/${comunicacionId}/comentarios`)
        .send({ comentario: '' });
      expect(res.status).toBe(400);
    });

    test('GET /:id/comentarios — lista comentarios', async () => {
      const res = await agent.get(`/api/comunicaciones/${comunicacionId}/comentarios`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  // ── Ciclo de vida ──────────────────────────────────────────────────────────
  describe('Ciclo de vida', () => {
    test('PATCH /:id/archivar — archiva la comunicación', async () => {
      const res = await agent.patch(`/api/comunicaciones/${comunicacionId}/archivar`);
      expect(res.status).toBe(200);
      const { rows } = await pool.query('SELECT is_active FROM comunicaciones WHERE id = $1', [comunicacionId]);
      expect(rows[0].is_active).toBe(false);
    });

    test('PATCH /:id/recuperar — recupera la comunicación', async () => {
      const res = await agent.patch(`/api/comunicaciones/${comunicacionId}/recuperar`);
      expect(res.status).toBe(200);
      const { rows } = await pool.query('SELECT is_active, estado FROM comunicaciones WHERE id = $1', [comunicacionId]);
      expect(rows[0].is_active).toBe(true);
      expect(rows[0].estado).toBe('pendiente');
    });

    test('PATCH /:id/respondida — marca como respondida y archiva', async () => {
      const res = await agent.patch(`/api/comunicaciones/${comunicacionId}/respondida`);
      expect(res.status).toBe(200);
      const { rows } = await pool.query('SELECT estado, is_active FROM comunicaciones WHERE id = $1', [comunicacionId]);
      expect(rows[0].estado).toBe('respondida');
      expect(rows[0].is_active).toBe(false);
    });

    test('DELETE /:id — borrado lógico', async () => {
      // Crear una comunicación extra para borrar
      const crear = await agent.post('/api/comunicaciones').send({
        entidad_id: entidadId,
        tipo: 'enviada',
        asunto: 'Para borrar',
        fecha_recepcion: '2026-06-01',
      });
      const extraId = crear.body.id;

      const res = await agent.delete(`/api/comunicaciones/${extraId}`);
      expect(res.status).toBe(200);
      const { rows } = await pool.query('SELECT is_active FROM comunicaciones WHERE id = $1', [extraId]);
      expect(rows[0].is_active).toBe(false);
    });
  });

  // ── Estadísticas ───────────────────────────────────────────────────────────
  describe('Estadísticas', () => {
    test('GET /stats — devuelve KPIs', async () => {
      const res = await agent.get('/api/comunicaciones/stats');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('kpis');
      expect(res.body).toHaveProperty('volumenPorEntidad');
      expect(res.body).toHaveProperty('tendencia');
    });

    test('GET /stats — acepta filtros de fecha', async () => {
      const res = await agent.get('/api/comunicaciones/stats?fecha_inicio=2026-01-01&fecha_fin=2026-12-31');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('kpis');
    });
  });
});
