import request from 'supertest';
import createApp from '../../src/app_test.js';
import pool from '../../src/db/database.js';
import bcrypt from 'bcrypt';

const app = createApp();
const agent = request.agent(app);

describe('Pagos — Integración', () => {
  let testUserUuid;
  let pagoId;
  let acreedorId;
  let proyectoId;

  const testEmail = 'pagos-test@icebreaker.com';
  const testPass  = 'testpass123';

  // ── Setup ──────────────────────────────────────────────────────────────────
  beforeAll(async () => {
    const hash = await bcrypt.hash(testPass, 10);
    const { rows } = await pool.query(
      `INSERT INTO global_usuarios (nombre, email, password_hash, rol, is_approved)
       VALUES ($1, $2, $3, 'juridico', true)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      ['Pagos Test', testEmail, hash]
    );
    testUserUuid = rows[0].id;

    await pool.query(`
      INSERT INTO permisos (usuario_uuid, modulo_id, accion_id)
      SELECT $1, m.id, a.id FROM modulos m, acciones a
      WHERE m.nombre = 'pagos' AND a.nombre IN ('READ_PAGO', 'WRITE_PAGO')
      ON CONFLICT DO NOTHING
    `, [testUserUuid]);

    // Tomar acreedor y proyecto existentes
    const { rows: acRows } = await pool.query('SELECT id FROM global_acreedores LIMIT 1');
    acreedorId = acRows[0].id;

    const { rows: pRows } = await pool.query('SELECT id FROM global_proyectos LIMIT 1');
    proyectoId = pRows[0].id;

    await agent.post('/api/auth/login').send({ email: testEmail, password: testPass });
  });

  // ── Teardown ───────────────────────────────────────────────────────────────
  afterAll(async () => {
    if (pagoId) {
      await pool.query('DELETE FROM pago_trazabilidad WHERE pago_id = $1', [pagoId]);
      await pool.query('DELETE FROM pago_grupos WHERE pago_id = $1', [pagoId]);
      await pool.query('DELETE FROM pagos WHERE id = $1', [pagoId]);
    }
    await pool.query('DELETE FROM pago_trazabilidad WHERE usuario_uuid = $1', [testUserUuid]);
    await pool.query('DELETE FROM pagos WHERE solicitante_uuid = $1', [testUserUuid]);
    await pool.query('DELETE FROM logs_sistema WHERE usuario_uuid = $1', [testUserUuid]);
    await pool.query('DELETE FROM permisos WHERE usuario_uuid = $1', [testUserUuid]);
    await pool.query('DELETE FROM global_usuarios WHERE id = $1', [testUserUuid]);
    await pool.end();
  });

  // ── Auth ──────────────────────────────────────────────────────────────────
  describe('Auth', () => {
    test('Debe rechazar peticiones sin token', async () => {
      const res = await request(app).get('/api/pagos');
      expect(res.status).toBe(401);
    });
  });

  // ── CRUD ──────────────────────────────────────────────────────────────────
  describe('CRUD', () => {
    test('POST / — crea pago', async () => {
      const res = await agent.post('/api/pagos').send({
        concepto: 'Pago de prueba CI',
        monto: 1500000,
        acreedor_id: acreedorId,
        fecha_solicitud: '2026-06-01',
        tipo_pago: 'ESTANDAR',
        proyecto_id: proyectoId,
        metodo_pago: 'TRANSFERENCIA',
      });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      pagoId = res.body.id;
    });

    test('POST / — falla sin campos obligatorios', async () => {
      const res = await agent.post('/api/pagos').send({
        concepto: 'Sin monto ni acreedor',
      });
      expect(res.status).toBe(400);
    });

    test('POST / — falla con tipo_pago inválido', async () => {
      const res = await agent.post('/api/pagos').send({
        concepto: 'Test',
        monto: 1000,
        acreedor_id: acreedorId,
        fecha_solicitud: '2026-06-01',
        tipo_pago: 'INVALIDO',
        proyecto_id: proyectoId,
      });
      expect(res.status).toBe(400);
    });

    test('GET / — lista pagos', async () => {
      const res = await agent.get('/api/pagos');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some(p => p.id === pagoId)).toBe(true);
    });

    test('GET /mis-pagos — lista del usuario autenticado', async () => {
      const res = await agent.get('/api/pagos/mis-pagos');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some(p => p.id === pagoId)).toBe(true);
    });
  });

  // ── Ciclo de vida ─────────────────────────────────────────────────────────
  describe('Ciclo de vida', () => {
    test('PATCH /:id/estado — transición solicitado → liberado', async () => {
      const res = await agent
        .patch(`/api/pagos/${pagoId}/estado`)
        .send({
          estado: 'liberado',
          comentario: 'Aprobado para pago',
        });
      expect(res.status).toBe(200);
      const { rows } = await pool.query('SELECT estado, fecha_liberacion FROM pagos WHERE id = $1', [pagoId]);
      expect(rows[0].estado).toBe('liberado');
      expect(rows[0].fecha_liberacion).not.toBeNull();
    });

    test('PATCH /:id/estado — falla sin comentario', async () => {
      const res = await agent
        .patch(`/api/pagos/${pagoId}/estado`)
        .send({ estado: 'pagado' });
      expect(res.status).toBe(400);
    });

    test('PATCH /:id/estado — falla sin estado', async () => {
      const res = await agent
        .patch(`/api/pagos/${pagoId}/estado`)
        .send({ comentario: 'Sin estado' });
      expect(res.status).toBe(400);
    });

    test('PATCH /:id/estado — transición → pagado archiva el pago', async () => {
      const res = await agent
        .patch(`/api/pagos/${pagoId}/estado`)
        .send({
          estado: 'pagado',
          comentario: 'Pago ejecutado',
        });
      expect(res.status).toBe(200);
      const { rows } = await pool.query('SELECT estado, is_active FROM pagos WHERE id = $1', [pagoId]);
      expect(rows[0].estado).toBe('pagado');
      expect(rows[0].is_active).toBe(false);
    });

    test('GET /:id/trazabilidad — devuelve historial completo', async () => {
      const res = await agent.get(`/api/pagos/${pagoId}/trazabilidad`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(3); // creado + liberado + pagado
    });
  });

  // ── Estadísticas ──────────────────────────────────────────────────────────
  describe('Estadísticas', () => {
    test('GET /stats — devuelve KPIs y tendencia', async () => {
      const res = await agent.get('/api/pagos/stats');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('kpis');
      expect(res.body).toHaveProperty('tendencia');
    });

    test('GET /stats — acepta filtros de fecha', async () => {
      const res = await agent.get('/api/pagos/stats?fecha_inicio=2026-01-01&fecha_fin=2026-12-31');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('kpis');
    });

    test('GET /stats — filtra por solicitante_uuid', async () => {
      const res = await agent.get(`/api/pagos/stats?solicitante_uuid=${testUserUuid}`);
      expect(res.status).toBe(200);
      expect(res.body.kpis).toHaveProperty('total_pagos');
    });
  });

  // ── Catálogos ─────────────────────────────────────────────────────────────
  describe('Catálogos', () => {
    test('GET /estados — lista estados de pago', async () => {
      const res = await agent.get('/api/pagos/estados');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /grupos — lista grupos', async () => {
      const res = await agent.get('/api/pagos/grupos');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
