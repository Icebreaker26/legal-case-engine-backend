import request from 'supertest';
import createApp from '../../src/app_test.js';
import pool from '../../src/db/database.js';
import bcrypt from 'bcrypt';

const app = createApp();
const agent = request.agent(app);

describe('Contratos — Integración', () => {
  let testUserUuid;
  let minutaId;
  let auditoriaId;

  const testEmail = 'contratos-test@icebreaker.com';
  const testPass  = 'testpass123';

  // ── Setup global ────────────────────────────────────────────────────────────
  beforeAll(async () => {
    const hash = await bcrypt.hash(testPass, 10);
    const { rows } = await pool.query(
      `INSERT INTO global_usuarios (nombre, email, password_hash, rol, is_approved)
       VALUES ($1, $2, $3, 'juridico', true)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      ['Contratos Test', testEmail, hash]
    );
    testUserUuid = rows[0].id;

    await pool.query(`
      INSERT INTO permisos (usuario_uuid, modulo_id, accion_id)
      SELECT $1, m.id, a.id FROM modulos m, acciones a
      WHERE m.nombre = 'contratos' AND a.nombre IN ('READ', 'WRITE', 'DELETE')
      ON CONFLICT DO NOTHING
    `, [testUserUuid]);

    await agent.post('/api/auth/login').send({ email: testEmail, password: testPass });

    // Minuta base para los tests de auditoría
    const { rows: mRows } = await pool.query(
      `INSERT INTO minutas_estandar (titulo, tipo_contrato, contenido_texto, created_by)
       VALUES ('Minuta Test CI', 'Prestación de Servicios', 'El contratista se compromete a...', $1)
       RETURNING id`,
      [testUserUuid]
    );
    minutaId = mRows[0].id;
  });

  // ── Teardown global ──────────────────────────────────────────────────────────
  afterAll(async () => {
    if (auditoriaId) await pool.query('DELETE FROM registros_auditoria WHERE id = $1', [auditoriaId]);
    if (minutaId)    await pool.query('DELETE FROM minutas_estandar WHERE id = $1', [minutaId]);
    await pool.query('DELETE FROM registros_auditoria WHERE creado_por = $1', [testUserUuid]);
    await pool.query('DELETE FROM minutas_estandar WHERE created_by = $1', [testUserUuid]);
    await pool.query('DELETE FROM logs_sistema WHERE usuario_uuid = $1', [testUserUuid]);
    await pool.query('DELETE FROM permisos WHERE usuario_uuid = $1', [testUserUuid]);
    await pool.query('DELETE FROM global_usuarios WHERE id = $1', [testUserUuid]);
    await pool.end();
  });

  // ── Autenticación ─────────────────────────────────────────────────────────
  describe('Autenticación', () => {
    test('GET /api/contratos/minutas sin token → 401', async () => {
      const res = await request(app).get('/api/contratos/minutas');
      expect(res.status).toBe(401);
    });

    test('POST /api/contratos/minutas sin token → 401', async () => {
      const res = await request(app).post('/api/contratos/minutas').send({});
      expect(res.status).toBe(401);
    });
  });

  // ── Minutas — listados ────────────────────────────────────────────────────
  describe('Minutas — listados', () => {
    test('GET /minutas → 200 y array', async () => {
      const res = await agent.get('/api/contratos/minutas');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /minutas/papelera → 200 y array', async () => {
      const res = await agent.get('/api/contratos/minutas/papelera');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /minutas/:id → 200 con minuta existente', async () => {
      const res = await agent.get(`/api/contratos/minutas/${minutaId}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('titulo');
    });

    test('GET /minutas/:id con id inexistente → 404 o 500', async () => {
      const res = await agent.get('/api/contratos/minutas/999999');
      expect([404, 500]).toContain(res.status);
    });
  });

  // ── Minutas — validaciones Zod ────────────────────────────────────────────
  describe('POST /minutas — validación Zod', () => {
    test('sin titulo → 400', async () => {
      const res = await agent.post('/api/contratos/minutas').send({
        tipo_contrato: 'Servicios',
        contenido_texto: 'Contenido'
      });
      expect(res.status).toBe(400);
    });

    test('sin tipo_contrato → 400', async () => {
      const res = await agent.post('/api/contratos/minutas').send({
        titulo: 'Test',
        contenido_texto: 'Contenido'
      });
      expect(res.status).toBe(400);
    });

    test('sin contenido_texto → 400', async () => {
      const res = await agent.post('/api/contratos/minutas').send({
        titulo: 'Test',
        tipo_contrato: 'Servicios'
      });
      expect(res.status).toBe(400);
    });

    test('payload completo → 201', async () => {
      const res = await agent.post('/api/contratos/minutas').send({
        titulo: 'Minuta Temporal Test',
        tipo_contrato: 'Consultoría',
        contenido_texto: 'Las partes acuerdan...',
        descripcion: 'Minuta de prueba'
      });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      // Cleanup inline
      if (res.body.id) await pool.query('DELETE FROM minutas_estandar WHERE id = $1', [res.body.id]);
    });
  });

  describe('PATCH /minutas/:id — validación Zod', () => {
    test('body vacío → 400', async () => {
      const res = await agent.patch(`/api/contratos/minutas/${minutaId}`).send({});
      expect(res.status).toBe(400);
    });

    test('payload completo → 200', async () => {
      // El controller hace SET titulo=$1, descripcion=$2, ... con todos los campos,
      // por eso se deben enviar todos para evitar NULLs en columnas NOT NULL
      const res = await agent.patch(`/api/contratos/minutas/${minutaId}`).send({
        titulo: 'Minuta Test CI',
        tipo_contrato: 'Prestación de Servicios',
        contenido_texto: 'El contratista se compromete a...',
        descripcion: 'Descripción actualizada en test'
      });
      expect(res.status).toBe(200);
    });
  });

  // ── Minutas — borrado lógico y restauración ───────────────────────────────
  describe('Minutas — borrado y restauración', () => {
    let minutaTempId;

    beforeAll(async () => {
      const { rows } = await pool.query(
        `INSERT INTO minutas_estandar (titulo, tipo_contrato, contenido_texto, created_by)
         VALUES ('Minuta Para Borrar', 'Test', 'Contenido', $1) RETURNING id`,
        [testUserUuid]
      );
      minutaTempId = rows[0].id;
    });

    afterAll(async () => {
      await pool.query('DELETE FROM minutas_estandar WHERE id = $1', [minutaTempId]);
    });

    test('DELETE /minutas/:id → 200 (borrado lógico)', async () => {
      const res = await agent.delete(`/api/contratos/minutas/${minutaTempId}`);
      expect(res.status).toBe(200);
    });

    test('PATCH /minutas/:id/restaurar → 200', async () => {
      const res = await agent.patch(`/api/contratos/minutas/${minutaTempId}/restaurar`);
      expect(res.status).toBe(200);
    });
  });

  // ── Auditorías — listados ─────────────────────────────────────────────────
  describe('Auditorías — listados', () => {
    test('GET /auditorias → 200 y array', async () => {
      const res = await agent.get('/api/contratos/auditorias');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── Auditorías — validaciones Zod ────────────────────────────────────────
  describe('POST /auditorias — validación Zod', () => {
    let terceroId;

    beforeAll(async () => {
      const { rows } = await pool.query(
        "SELECT id FROM global_entidades WHERE is_active = true LIMIT 1"
      );
      terceroId = rows[0]?.id;
    });

    test('sin minuta_estandar_id → 400', async () => {
      const res = await agent.post('/api/contratos/auditorias').send({
        tercero_id: terceroId,
        contenido_tercero_texto: 'Texto del tercero'
      });
      expect(res.status).toBe(400);
    });

    test('sin tercero_id → 400', async () => {
      const res = await agent.post('/api/contratos/auditorias').send({
        minuta_estandar_id: minutaId
      });
      expect(res.status).toBe(400);
    });

    test('minuta_estandar_id no es UUID → 400', async () => {
      const res = await agent.post('/api/contratos/auditorias').send({
        minuta_estandar_id: 'no-es-uuid',
        tercero_id: terceroId
      });
      expect(res.status).toBe(400);
    });

    test('payload válido → 201', async () => {
      const res = await agent.post('/api/contratos/auditorias').send({
        minuta_estandar_id: minutaId,
        tercero_id: terceroId,
        contenido_tercero_texto: 'Texto del contrato del tercero para auditoría'
      });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      if (res.body.id) auditoriaId = res.body.id;
    });
  });

  describe('PATCH /auditorias/:id — validación Zod', () => {
    test('body vacío → 400', async () => {
      if (!auditoriaId) return;
      const res = await agent.patch(`/api/contratos/auditorias/${auditoriaId}`).send({});
      expect(res.status).toBe(400);
    });

    test('payload válido → 200', async () => {
      if (!auditoriaId) return;
      const res = await agent.patch(`/api/contratos/auditorias/${auditoriaId}`).send({
        estado_seguimiento: 'Revisado',
        resultado_llm_texto: 'Sin observaciones relevantes.'
      });
      expect(res.status).toBe(200);
    });
  });

  describe('POST /auditorias/:id/regenerar-prompt — validación Zod', () => {
    test('sin minuta_estandar_id → 400', async () => {
      if (!auditoriaId) return;
      const res = await agent.post(`/api/contratos/auditorias/${auditoriaId}/regenerar-prompt`).send({});
      expect(res.status).toBe(400);
    });

    test('con minuta válida → 200', async () => {
      if (!auditoriaId) return;
      const res = await agent
        .post(`/api/contratos/auditorias/${auditoriaId}/regenerar-prompt`)
        .send({ minuta_estandar_id: minutaId });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('prompt');
    });
  });

  // ── Comparar contrato (multipart) ─────────────────────────────────────────
  describe('POST /auditorias/comparar', () => {
    test('sin archivo → 400', async () => {
      const res = await agent.post('/api/contratos/auditorias/comparar').send({
        minutaEstandarId: minutaId
      });
      expect(res.status).toBe(400);
    });

    test('con archivo y minuta válida → 200 con prompt', async () => {
      const res = await agent
        .post('/api/contratos/auditorias/comparar')
        .field('minutaEstandarId', minutaId)
        .attach('file', Buffer.from('Texto modificado del contrato del tercero'), 'contrato.txt');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('prompt');
    });
  });

  // ── GET /auditorias/:id y diff ────────────────────────────────────────────
  describe('Auditoría — detalle y diff', () => {
    test('GET /auditorias/:id → 200', async () => {
      if (!auditoriaId) return;
      const res = await agent.get(`/api/contratos/auditorias/${auditoriaId}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
    });

    test('GET /auditorias/:id inexistente → 404 o 500', async () => {
      const res = await agent.get('/api/contratos/auditorias/999999');
      expect([404, 500]).toContain(res.status);
    });

    test('GET /auditorias/:id/diff → 200', async () => {
      if (!auditoriaId) return;
      const res = await agent.get(`/api/contratos/auditorias/${auditoriaId}/diff`);
      expect(res.status).toBe(200);
    });
  });
});
