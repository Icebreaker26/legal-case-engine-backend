import request from 'supertest';
import createApp from '../../src/app_test.js';
import pool from '../../src/db/database.js';
import bcrypt from 'bcrypt';

const app = createApp();
const agent = request.agent(app);

describe('Conformidades — Integración', () => {
  let testUserUuid;
  let conformidadId;
  let proyectoId;
  let contratoId;
  let entidadId;
  let estadoId;

  const testEmail = 'conformidades-test@icebreaker.com';
  const testPass  = 'testpass123';

  // ── Setup ──────────────────────────────────────────────────────────────────
  beforeAll(async () => {
    const hash = await bcrypt.hash(testPass, 10);
    const { rows } = await pool.query(
      `INSERT INTO global_usuarios (nombre, email, password_hash, rol, is_approved)
       VALUES ($1, $2, $3, 'juridico', true)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      ['Conformidades Test', testEmail, hash]
    );
    testUserUuid = rows[0].id;

    await pool.query(`
      INSERT INTO permisos (usuario_uuid, modulo_id, accion_id)
      SELECT $1, m.id, a.id FROM modulos m, acciones a
      WHERE m.nombre = 'conformidades' AND a.nombre IN ('READ', 'WRITE')
      ON CONFLICT DO NOTHING
    `, [testUserUuid]);

    // Catálogos de prueba
    const { rows: pRows } = await pool.query(
      `INSERT INTO global_proyectos (nombre) VALUES ('Proyecto CI Test') RETURNING id`
    );
    proyectoId = pRows[0].id;

    const { rows: cRows } = await pool.query(
      `INSERT INTO global_contratos (numero) VALUES ('CONTRATO-CI-001') RETURNING id`
    );
    contratoId = cRows[0].id;

    const { rows: eRows } = await pool.query(
      `INSERT INTO global_entidades (nombre, is_active) VALUES ('Entidad Conf CI', true) RETURNING id`
    );
    entidadId = eRows[0].id;

    await agent.post('/api/auth/login').send({ email: testEmail, password: testPass });
  });

  // ── Teardown ───────────────────────────────────────────────────────────────
  afterAll(async () => {
    if (conformidadId) {
      await pool.query('DELETE FROM conformidad_trazabilidad WHERE conformidad_id = $1', [conformidadId]);
      await pool.query('DELETE FROM conformidad_grupos WHERE conformidad_id = $1', [conformidadId]);
      await pool.query('DELETE FROM conformidades WHERE id = $1', [conformidadId]);
    }
    if (estadoId) await pool.query('DELETE FROM conformidad_estados WHERE id = $1', [estadoId]);
    await pool.query('DELETE FROM global_proyectos WHERE id = $1', [proyectoId]);
    await pool.query('DELETE FROM global_contratos WHERE id = $1', [contratoId]);
    await pool.query('DELETE FROM global_entidades WHERE id = $1', [entidadId]);
    await pool.query('DELETE FROM logs_sistema WHERE usuario_uuid = $1', [testUserUuid]);
    await pool.query('DELETE FROM permisos WHERE usuario_uuid = $1', [testUserUuid]);
    await pool.query('DELETE FROM global_usuarios WHERE id = $1', [testUserUuid]);
    await pool.end();
  });

  // ── Autenticación ──────────────────────────────────────────────────────────
  describe('Auth', () => {
    test('Debe rechazar peticiones sin token', async () => {
      const res = await request(app).get('/api/conformidades');
      expect(res.status).toBe(401);
    });
  });

  // ── Catálogos ─────────────────────────────────────────────────────────────
  describe('Catálogos', () => {
    test('GET /proyectos — lista proyectos activos', async () => {
      const res = await agent.get('/api/conformidades/proyectos');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('POST /proyectos — falla sin nombre', async () => {
      const res = await agent.post('/api/conformidades/proyectos').send({});
      expect(res.status).toBe(400);
    });

    test('GET /contratos — lista contratos', async () => {
      const res = await agent.get('/api/conformidades/contratos');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /entidades — lista entidades activas', async () => {
      const res = await agent.get('/api/conformidades/entidades');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /estados — lista estados de conformidad', async () => {
      const res = await agent.get('/api/conformidades/estados');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('POST /estados — crea un estado', async () => {
      const res = await agent.post('/api/conformidades/estados').send({ nombre: 'ESTADO_CI', orden: 99 });
      expect(res.status).toBe(201);
      const { rows } = await pool.query("SELECT id FROM conformidad_estados WHERE nombre = 'ESTADO_CI'");
      estadoId = rows[0]?.id;
    });

    test('POST /estados — falla sin nombre', async () => {
      const res = await agent.post('/api/conformidades/estados').send({ orden: 1 });
      expect(res.status).toBe(400);
    });
  });

  // ── CRUD conformidades ────────────────────────────────────────────────────
  describe('CRUD', () => {
    test('POST / — crea conformidad', async () => {
      const res = await agent.post('/api/conformidades').send({
        concepto: 'Conformidad de prueba CI',
        entidad_id: entidadId,
        proyecto_id: proyectoId,
        contrato_id: contratoId,
        responsable_uuid: testUserUuid,
        fecha_recepcion: '2026-06-01',
        fecha_solicitud: '2026-06-02',
        ot: 'OT-001',
        wbe: 'WBE-001',
        valor: 5000,
      });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      conformidadId = res.body.id;
    });

    test('POST / — falla sin campos obligatorios', async () => {
      const res = await agent.post('/api/conformidades').send({
        concepto: 'Sin entidad',
        // falta entidad_id, proyecto_id, contrato_id, etc.
      });
      expect(res.status).toBe(400);
    });

    test('POST / — falla con responsable_uuid inválido', async () => {
      const res = await agent.post('/api/conformidades').send({
        concepto: 'Test',
        entidad_id: entidadId,
        proyecto_id: proyectoId,
        contrato_id: contratoId,
        responsable_uuid: 'no-es-uuid',
        fecha_recepcion: '2026-06-01',
        fecha_solicitud: '2026-06-02',
        ot: 'OT-001',
        wbe: 'WBE-001',
        valor: 100,
      });
      expect(res.status).toBe(400);
    });

    test('GET / — lista conformidades', async () => {
      const res = await agent.get('/api/conformidades');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some(c => c.id === conformidadId)).toBe(true);
    });

    test('GET /mis-conformidades — lista del usuario', async () => {
      const res = await agent.get('/api/conformidades/mis-conformidades');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── Ciclo de vida / estado ────────────────────────────────────────────────
  describe('Ciclo de vida', () => {
    test('PATCH /:id/estado — actualiza estado con trazabilidad', async () => {
      const res = await agent
        .patch(`/api/conformidades/${conformidadId}/estado`)
        .send({
          estado: 'EN_REVISION',
          estado_anterior: 'SOLICITADO',
          comentario: 'Pasando a revisión',
        });
      expect(res.status).toBe(200);
      const { rows } = await pool.query('SELECT estado FROM conformidades WHERE id = $1', [conformidadId]);
      expect(rows[0].estado).toBe('EN_REVISION');
    });

    test('PATCH /:id/estado — falla sin comentario', async () => {
      const res = await agent
        .patch(`/api/conformidades/${conformidadId}/estado`)
        .send({ estado: 'CONFORMADO' });
      expect(res.status).toBe(400);
    });

    test('PATCH /:id/estado — CONFORMADO archiva la conformidad', async () => {
      const res = await agent
        .patch(`/api/conformidades/${conformidadId}/estado`)
        .send({
          estado: 'CONFORMADO',
          estado_anterior: 'EN_REVISION',
          comentario: 'Conformado.',
          numero_conformidad: 'CONF-2026-001',
        });
      expect(res.status).toBe(200);
      const { rows } = await pool.query('SELECT estado, is_active FROM conformidades WHERE id = $1', [conformidadId]);
      expect(rows[0].estado).toBe('CONFORMADO');
      expect(rows[0].is_active).toBe(false);
    });

    test('GET /:id/trazabilidad — devuelve historial', async () => {
      const res = await agent.get(`/api/conformidades/${conformidadId}/trazabilidad`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  // ── Estadísticas ──────────────────────────────────────────────────────────
  describe('Estadísticas', () => {
    test('GET /stats — devuelve KPIs y distribución de estados', async () => {
      const res = await agent.get('/api/conformidades/stats');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('kpis');
      expect(res.body).toHaveProperty('estados');
    });

    test('GET /stats — acepta filtro por entidad', async () => {
      const res = await agent.get(`/api/conformidades/stats?entidad_id=${entidadId}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('kpis');
    });
  });
});
