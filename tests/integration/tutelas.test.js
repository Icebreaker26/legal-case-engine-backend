import request from 'supertest';
import createApp from '../../src/app_test.js';
import pool from '../../src/db/database.js';
import bcrypt from 'bcrypt';

const app = createApp();
const agent = request.agent(app);

describe('Tutelas — Integración', () => {
  let testUserUuid;
  let tutelaId;
  let argumentoId;

  const testEmail = 'tutelas-test@icebreaker.com';
  const testPass  = 'testpass123';

  // ── Setup global ────────────────────────────────────────────────────────────
  beforeAll(async () => {
    const hash = await bcrypt.hash(testPass, 10);
    const { rows } = await pool.query(
      `INSERT INTO global_usuarios (nombre, email, password_hash, rol, is_approved)
       VALUES ($1, $2, $3, 'juridico', true)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      ['Tutelas Test', testEmail, hash]
    );
    testUserUuid = rows[0].id;

    await pool.query(`
      INSERT INTO permisos (usuario_uuid, modulo_id, accion_id)
      SELECT $1, m.id, a.id FROM modulos m, acciones a
      WHERE m.nombre = 'tutelas' AND a.nombre IN ('READ', 'WRITE', 'DELETE')
      ON CONFLICT DO NOTHING
    `, [testUserUuid]);

    await agent.post('/api/auth/login').send({ email: testEmail, password: testPass });

    const { rows: tRows } = await pool.query(`
      INSERT INTO tutelas (radicado, accionante, derecho_vulnerado, estado, is_active, responsable_uuid)
      VALUES ('TEST-2026-001', 'Accionante Test', 'Salud', 'Pendiente', true, $1)
      ON CONFLICT (radicado) DO UPDATE SET responsable_uuid = EXCLUDED.responsable_uuid
      RETURNING id
    `, [testUserUuid]);
    tutelaId = tRows[0].id;
  });

  // ── Teardown global ──────────────────────────────────────────────────────────
  afterAll(async () => {
    if (tutelaId) {
      await pool.query('DELETE FROM historial_acciones WHERE tutela_id = $1', [tutelaId]);
      await pool.query('DELETE FROM requerimientos_internos WHERE tutela_id = $1', [tutelaId]);
      await pool.query('DELETE FROM tutela_argumentos WHERE tutela_id = $1', [tutelaId]);
      await pool.query('DELETE FROM tutelas WHERE id = $1', [tutelaId]);
    }
    if (testUserUuid) {
      await pool.query('DELETE FROM logs_sistema WHERE usuario_uuid = $1', [testUserUuid]);
      await pool.query('DELETE FROM permisos WHERE usuario_uuid = $1', [testUserUuid]);
      await pool.query('DELETE FROM global_usuarios WHERE id = $1', [testUserUuid]);
    }
    await pool.end();
  });

  // ── Autenticación ─────────────────────────────────────────────────────────
  describe('Autenticación', () => {
    test('GET /api/tutelas sin token → 401', async () => {
      const res = await request(app).get('/api/tutelas');
      expect(res.status).toBe(401);
    });

    test('POST /api/tutelas/procesar sin token → 401', async () => {
      const res = await request(app).post('/api/tutelas/procesar');
      expect(res.status).toBe(401);
    });
  });

  // ── Listar tutelas ────────────────────────────────────────────────────────
  describe('Listados', () => {
    test('GET /api/tutelas → 200 y array', async () => {
      const res = await agent.get('/api/tutelas');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /api/tutelas/mis-tutelas → 200 y array', async () => {
      const res = await agent.get('/api/tutelas/mis-tutelas');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /api/tutelas/estadisticas → 200', async () => {
      const res = await agent.get('/api/tutelas/estadisticas');
      expect(res.status).toBe(200);
    });

    test('GET /api/tutelas/papelera → 200 con tutelas y memoria', async () => {
      const res = await agent.get('/api/tutelas/papelera');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('tutelas');
      expect(res.body).toHaveProperty('memoria');
      expect(Array.isArray(res.body.tutelas)).toBe(true);
      expect(Array.isArray(res.body.memoria)).toBe(true);
    });

    test('GET /api/tutelas/categorias → 200 y array', async () => {
      const res = await agent.get('/api/tutelas/categorias');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /api/tutelas/festivos → 200 y array', async () => {
      const res = await agent.get('/api/tutelas/festivos');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── Validaciones Zod — PATCH /:id ────────────────────────────────────────
  describe('PATCH /api/tutelas/:id — validación Zod', () => {
    test('UUID inválido en responsable_uuid → 400', async () => {
      const res = await agent.patch(`/api/tutelas/${tutelaId}`).send({ responsable_uuid: 'no-es-uuid' });
      expect(res.status).toBe(400);
    });

    test('sharepoint_link con URL inválida → 400', async () => {
      const res = await agent.patch(`/api/tutelas/${tutelaId}`).send({ sharepoint_link: 'esto no es url' });
      expect(res.status).toBe(400);
    });

    test('payload válido → no 400', async () => {
      const res = await agent.patch(`/api/tutelas/${tutelaId}`).send({ accionante: 'Nuevo Accionante' });
      expect(res.status).not.toBe(400);
    });
  });

  // ── Validaciones Zod — PATCH /:id/datos ─────────────────────────────────
  describe('PATCH /api/tutelas/:id/datos — validación Zod', () => {
    test('prioridad fuera del enum → 400', async () => {
      const res = await agent.patch(`/api/tutelas/${tutelaId}/datos`).send({ prioridad: 'Urgentísima' });
      expect(res.status).toBe(400);
    });

    test('prioridad válida → no 400', async () => {
      const res = await agent.patch(`/api/tutelas/${tutelaId}/datos`).send({ prioridad: 'Alta' });
      expect(res.status).not.toBe(400);
    });
  });

  // ── Historial ────────────────────────────────────────────────────────────
  describe('Historial', () => {
    test('GET /:id/historial → 200 y array', async () => {
      const res = await agent.get(`/api/tutelas/${tutelaId}/historial`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('POST /:id/historial sin accion → 400 (Zod)', async () => {
      const res = await agent.post(`/api/tutelas/${tutelaId}/historial`).send({});
      expect(res.status).toBe(400);
    });

    test('POST /:id/historial con accion → 200/201', async () => {
      const res = await agent
        .post(`/api/tutelas/${tutelaId}/historial`)
        .send({ accion: 'Revisión de documentos', area_involucrada: 'Jurídico' });
      expect([200, 201]).toContain(res.status);
    });
  });

  // ── Requerimientos internos ───────────────────────────────────────────────
  describe('Requerimientos internos', () => {
    test('GET /:id/requerimientos → 200 y array', async () => {
      const res = await agent.get(`/api/tutelas/${tutelaId}/requerimientos`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('POST /:id/requerimientos sin grupo_id → 400 (Zod)', async () => {
      const res = await agent
        .post(`/api/tutelas/${tutelaId}/requerimientos`)
        .send({ descripcion: 'Sin grupo' });
      expect(res.status).toBe(400);
    });

    test('POST /:id/requerimientos sin descripcion → 400 (Zod)', async () => {
      const res = await agent
        .post(`/api/tutelas/${tutelaId}/requerimientos`)
        .send({ grupo_id: 1 });
      expect(res.status).toBe(400);
    });

    test('POST /:id/requerimientos con prioridad inválida → 400 (Zod)', async () => {
      const res = await agent
        .post(`/api/tutelas/${tutelaId}/requerimientos`)
        .send({ grupo_id: 1, descripcion: 'Test', prioridad: 'Crítica' });
      expect(res.status).toBe(400);
    });
  });

  // ── Argumentos personalizados ─────────────────────────────────────────────
  describe('Argumentos personalizados', () => {
    test('GET /:id/argumentos → 200 y array', async () => {
      const res = await agent.get(`/api/tutelas/${tutelaId}/argumentos`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('POST /:id/argumentos sin titulo → 400 (Zod)', async () => {
      const res = await agent
        .post(`/api/tutelas/${tutelaId}/argumentos`)
        .send({ contenido: 'Contenido sin título' });
      expect(res.status).toBe(400);
    });

    test('POST /:id/argumentos sin contenido → 400 (Zod)', async () => {
      const res = await agent
        .post(`/api/tutelas/${tutelaId}/argumentos`)
        .send({ titulo: 'Título sin contenido' });
      expect(res.status).toBe(400);
    });

    test('POST /:id/argumentos válido → 200/201', async () => {
      const res = await agent
        .post(`/api/tutelas/${tutelaId}/argumentos`)
        .send({ titulo: 'Argumento de prueba', contenido: 'El derecho a la salud es fundamental.' });
      expect([200, 201]).toContain(res.status);
      if (res.body?.id) argumentoId = res.body.id;
    });

    test('PATCH /:id/argumentos/:argId con body vacío → 400 (Zod)', async () => {
      if (!argumentoId) return;
      const res = await agent
        .patch(`/api/tutelas/${tutelaId}/argumentos/${argumentoId}`)
        .send({});
      expect(res.status).toBe(400);
    });

    test('PATCH /:id/argumentos/:argId válido → pasa validación Zod (no 400)', async () => {
      if (!argumentoId) return;
      const res = await agent
        .patch(`/api/tutelas/${tutelaId}/argumentos/${argumentoId}`)
        .send({ titulo: 'Argumento actualizado' });
      expect(res.status).not.toBe(400);
    });
  });

  // ── Bloqueo optimista de borrador ─────────────────────────────────────────
  describe('Bloqueo de borrador', () => {
    test('GET /:id/lock-status → 200', async () => {
      const res = await agent.get(`/api/tutelas/${tutelaId}/lock-status`);
      expect(res.status).toBe(200);
    });

    test('POST /:id/lock → 200 o 409 si ya está bloqueado', async () => {
      const res = await agent.post(`/api/tutelas/${tutelaId}/lock`);
      expect([200, 409]).toContain(res.status);
    });

    test('POST /:id/unlock → 200 o 400', async () => {
      const res = await agent.post(`/api/tutelas/${tutelaId}/unlock`);
      expect([200, 400]).toContain(res.status);
    });

    test('PATCH /:id/borrador sin contestacion_generada → 400 (Zod)', async () => {
      const res = await agent.patch(`/api/tutelas/${tutelaId}/borrador`).send({});
      expect(res.status).toBe(400);
    });
  });

  // ── Memoria / RAG ─────────────────────────────────────────────────────────
  describe('Memoria legal', () => {
    test('GET /api/tutelas/memoria → 200 y array', async () => {
      const res = await agent.get('/api/tutelas/memoria');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('POST /memoria/:id/feedback sin campo util → 400 (Zod)', async () => {
      const res = await agent.post('/api/tutelas/memoria/doc-inexistente/feedback').send({});
      expect(res.status).toBe(400);
    });

    test('POST /memoria/:id/feedback con string en util → 400 (Zod)', async () => {
      const res = await agent
        .post('/api/tutelas/memoria/doc-inexistente/feedback')
        .send({ util: 'si' });
      expect(res.status).toBe(400);
    });

    test('POST /memoria/:id/feedback válido → no 400 (puede ser 404 si doc no existe)', async () => {
      const res = await agent
        .post('/api/tutelas/memoria/doc-inexistente/feedback')
        .send({ util: true });
      expect(res.status).not.toBe(400);
    });
  });

  // ── Admin: Noise patterns ────────────────────────────────────────────────
  describe('Noise patterns', () => {
    let noiseId;

    test('GET /api/tutelas/noise → 200 y array', async () => {
      const res = await agent.get('/api/tutelas/noise');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('POST /api/tutelas/noise sin patron → 400 (Zod)', async () => {
      const res = await agent.post('/api/tutelas/noise').send({ descripcion: 'Sin patrón' });
      expect(res.status).toBe(400);
    });

    test('POST /api/tutelas/noise válido → 201', async () => {
      const res = await agent
        .post('/api/tutelas/noise')
        .send({ patron: 'TEST_NOISE_PATTERN', descripcion: 'Patrón de prueba' });
      expect(res.status).toBe(201);
      const { rows } = await pool.query("SELECT id FROM noise_patterns WHERE patron = 'TEST_NOISE_PATTERN'");
      if (rows.length) noiseId = rows[0].id;
    });

    test('PATCH /api/tutelas/noise/:id con body vacío → 400 (Zod)', async () => {
      if (!noiseId) return;
      const res = await agent.patch(`/api/tutelas/noise/${noiseId}`).send({});
      expect(res.status).toBe(400);
    });

    test('PATCH /api/tutelas/noise/:id válido → 200', async () => {
      if (!noiseId) return;
      const res = await agent
        .patch(`/api/tutelas/noise/${noiseId}`)
        .send({ descripcion: 'Actualizado', activo: false });
      expect(res.status).toBe(200);
    });

    afterAll(async () => {
      if (noiseId) await pool.query('DELETE FROM noise_patterns WHERE id = $1', [noiseId]);
    });
  });

  // ── Admin: ROI ───────────────────────────────────────────────────────────
  describe('ROI', () => {
    test('GET /api/tutelas/roi → 200 con campos esperados', async () => {
      const res = await agent.get('/api/tutelas/roi');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalTutelas');
      expect(res.body).toHaveProperty('horasAhorradas');
      expect(res.body).toHaveProperty('dineroAhorrado');
    });

    test('PATCH /api/tutelas/roi sin campos → 400 (Zod)', async () => {
      const res = await agent.patch('/api/tutelas/roi').send({});
      expect(res.status).toBe(400);
    });

    test('PATCH /api/tutelas/roi con valores negativos → 400 (Zod)', async () => {
      const res = await agent.patch('/api/tutelas/roi').send({
        tiempo_ahorrado_minutos: -10,
        costo_hora_juridico: 50
      });
      expect(res.status).toBe(400);
    });

    test('PATCH /api/tutelas/roi válido → 200', async () => {
      const res = await agent.patch('/api/tutelas/roi').send({
        tiempo_ahorrado_minutos: 90,
        costo_hora_juridico: 45.5
      });
      expect(res.status).toBe(200);
    });
  });

  // ── Admin: Config ────────────────────────────────────────────────────────
  describe('Configuración', () => {
    test('GET /api/tutelas/config → 200', async () => {
      const res = await agent.get('/api/tutelas/config');
      expect(res.status).toBe(200);
    });

    test('POST /api/tutelas/config sin key → 400 (Zod)', async () => {
      const res = await agent.post('/api/tutelas/config').send({ value: true });
      expect(res.status).toBe(400);
    });

    test('POST /api/tutelas/config válido → 200', async () => {
      const res = await agent.post('/api/tutelas/config').send({ key: 'test_config', value: 'test_value' });
      expect(res.status).toBe(200);
    });
  });

  // ── Admin: Métricas ──────────────────────────────────────────────────────
  describe('Métricas operativas', () => {
    test('GET /api/tutelas/carga-trabajo → 200 y array', async () => {
      const res = await agent.get('/api/tutelas/carga-trabajo');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /api/tutelas/latencia → 200 y array', async () => {
      const res = await agent.get('/api/tutelas/latencia');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── Logs ─────────────────────────────────────────────────────────────────
  describe('Logs', () => {
    test('GET /api/tutelas/logs → 200 con paginación', async () => {
      const res = await agent.get('/api/tutelas/logs');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('GET /api/tutelas/logs/mis-logs → 200 y array', async () => {
      const res = await agent.get('/api/tutelas/logs/mis-logs');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── Restaurar (Zod) ───────────────────────────────────────────────────────
  describe('POST /api/tutelas/restaurar — validación Zod', () => {
    test('sin id → 400', async () => {
      const res = await agent.post('/api/tutelas/restaurar').send({ tipo: 'tutela' });
      expect(res.status).toBe(400);
    });

    test('sin tipo → 400', async () => {
      const res = await agent.post('/api/tutelas/restaurar').send({ id: 1 });
      expect(res.status).toBe(400);
    });
  });
});
