import request from 'supertest';
import createApp from '../../src/app_test.js';
import pool from '../../src/db/database.js';
import bcrypt from 'bcrypt';

const app = createApp();
const agent = request.agent(app);

describe('Ambiental — Integración', () => {
  let testUserUuid;
  let expedienteId;
  let analisisId;

  const testEmail = 'ambiental-test@icebreaker.com';
  const testPass  = 'testpass123';

  const llmJsonValido = JSON.stringify({
    que_ordena: 'Presentar Plan de Manejo Ambiental en 30 días.',
    admite_recurso: 'Sí',
    plazo_respuesta: '30 días hábiles desde notificación',
    nivel_riesgo: 'Alto',
    resumen: 'La resolución ordena la presentación de un PMA. Se identifican dos incumplimientos a la Ley 99/93.',
    hallazgos: [
      {
        numero: 1,
        tipo: 'Incumplimiento',
        descripcion: 'No se presentó el Plan de Manejo Ambiental en el plazo estipulado.',
        norma_infringida: 'Art. 49 Ley 99/93',
        recomendacion: 'Presentar PMA dentro del plazo otorgado.',
        prioridad: 'Alta',
      },
      {
        numero: 2,
        tipo: 'Riesgo',
        descripcion: 'Posible afectación a fuentes hídricas por actividades de obra.',
        norma_infringida: 'Art. 2.2.9.3.1.1 Decreto 1076/2015',
        recomendacion: 'Implementar medidas de manejo de aguas residuales.',
        prioridad: 'Media',
      },
    ],
    normas_citadas: [
      { instrumento: 'Ley 99/93', articulo: 'Art. 49', descripcion: 'Licencias ambientales' },
      { instrumento: 'Decreto 1076/2015', articulo: 'Art. 2.2.9.3.1.1', descripcion: 'Manejo de aguas residuales' },
    ],
  });

  // ── Setup ──────────────────────────────────────────────────────────────────
  beforeAll(async () => {
    const hash = await bcrypt.hash(testPass, 10);
    const { rows } = await pool.query(
      `INSERT INTO global_usuarios (nombre, email, password_hash, rol, is_approved)
       VALUES ($1, $2, $3, 'juridico', true)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      ['Ambiental Test', testEmail, hash]
    );
    testUserUuid = rows[0].id;

    await pool.query(
      `INSERT INTO permisos (usuario_uuid, modulo_id, accion_id)
       SELECT $1, m.id, a.id FROM modulos m, acciones a
       WHERE m.nombre = 'ambiental' AND a.nombre IN ('READ', 'WRITE', 'DELETE')
       ON CONFLICT DO NOTHING`,
      [testUserUuid]
    );

    await agent.post('/api/auth/login').send({ email: testEmail, password: testPass });
  });

  // ── Teardown ───────────────────────────────────────────────────────────────
  afterAll(async () => {
    await pool.query(
      `DELETE FROM expedientes_ambientales WHERE creado_por = $1`,
      [testUserUuid]
    );
    await pool.query('DELETE FROM logs_sistema WHERE usuario_uuid = $1', [testUserUuid]);
    await pool.query('DELETE FROM permisos WHERE usuario_uuid = $1', [testUserUuid]);
    await pool.query('DELETE FROM global_usuarios WHERE id = $1', [testUserUuid]);
    await pool.end();
  });

  // ── Autenticación ──────────────────────────────────────────────────────────
  describe('Autenticación', () => {
    test('GET /expedientes sin token → 401', async () => {
      const res = await request(app).get('/api/ambiental/expedientes');
      expect(res.status).toBe(401);
    });

    test('POST /expedientes sin token → 401', async () => {
      const res = await request(app).post('/api/ambiental/expedientes').send({});
      expect(res.status).toBe(401);
    });
  });

  // ── Expedientes — listado ──────────────────────────────────────────────────
  describe('GET /expedientes', () => {
    test('→ 200 y array', async () => {
      const res = await agent.get('/api/ambiental/expedientes');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('filtro por estado → 200 y array', async () => {
      const res = await agent.get('/api/ambiental/expedientes?estado=Pendiente');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('filtro por tipo_instrumento → 200 y array', async () => {
      const res = await agent.get('/api/ambiental/expedientes?tipo_instrumento=auto');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── Expedientes — validación Zod ──────────────────────────────────────────
  describe('POST /expedientes — validación Zod', () => {
    test('sin titulo → 400', async () => {
      const res = await agent.post('/api/ambiental/expedientes').send({
        tipo_instrumento: 'auto',
      });
      expect(res.status).toBe(400);
    });

    test('sin tipo_instrumento → 400', async () => {
      const res = await agent.post('/api/ambiental/expedientes').send({
        titulo: 'Resolución 001',
      });
      expect(res.status).toBe(400);
    });

    test('payload válido → 201 con id', async () => {
      const res = await agent.post('/api/ambiental/expedientes').send({
        titulo: 'Resolución 001-2026',
        tipo_instrumento: 'resolución',
        numero_expediente: 'EXP-2026-001',
        fecha_documento: '2026-01-15',
      });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expedienteId = res.body.id;
    });
  });

  // ── Expedientes — detalle y actualización ─────────────────────────────────
  describe('GET /expedientes/:id', () => {
    test('id existente → 200 con titulo', async () => {
      if (!expedienteId) return;
      const res = await agent.get(`/api/ambiental/expedientes/${expedienteId}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('titulo');
    });

    test('id inexistente → 404', async () => {
      const res = await agent.get('/api/ambiental/expedientes/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /expedientes/:id — validación Zod', () => {
    test('body vacío → 400', async () => {
      if (!expedienteId) return;
      const res = await agent.patch(`/api/ambiental/expedientes/${expedienteId}`).send({});
      expect(res.status).toBe(400);
    });

    test('estado válido → 200', async () => {
      if (!expedienteId) return;
      const res = await agent.patch(`/api/ambiental/expedientes/${expedienteId}`).send({
        estado: 'Revisado',
      });
      expect(res.status).toBe(200);
      expect(res.body.estado).toBe('Revisado');
    });

    test('estado inválido → 400', async () => {
      if (!expedienteId) return;
      const res = await agent.patch(`/api/ambiental/expedientes/${expedienteId}`).send({
        estado: 'EstadoInexistente',
      });
      expect(res.status).toBe(400);
    });
  });

  // ── Procesar documento ────────────────────────────────────────────────────
  describe('POST /expedientes/procesar', () => {
    test('sin archivo → 400', async () => {
      const res = await agent.post('/api/ambiental/expedientes/procesar');
      expect(res.status).toBe(400);
    });

    test('con archivo TXT → 200 con prompt y contenido_texto', async () => {
      const res = await agent
        .post('/api/ambiental/expedientes/procesar')
        .attach('file', Buffer.from('RESOLUCIÓN 001. Se ordena presentar PMA. Ley 99 de 1993.'), 'doc.txt');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('contenido_texto');
      expect(res.body).toHaveProperty('prompt_generado');
      expect(res.body.prompt_generado).toMatch(/Ley 99/);
    });
  });

  // ── Análisis — guardar (relacional) ──────────────────────────────────────
  describe('POST /expedientes/:id/analisis — guardar análisis LLM', () => {
    test('sin resultado_llm_json → 400', async () => {
      if (!expedienteId) return;
      const res = await agent
        .post(`/api/ambiental/expedientes/${expedienteId}/analisis`)
        .send({});
      expect(res.status).toBe(400);
    });

    test('JSON inválido → 400', async () => {
      if (!expedienteId) return;
      const res = await agent
        .post(`/api/ambiental/expedientes/${expedienteId}/analisis`)
        .send({ resultado_llm_json: 'esto no es json {{{' });
      expect(res.status).toBe(400);
    });

    test('JSON con estructura incorrecta → 400', async () => {
      if (!expedienteId) return;
      const res = await agent
        .post(`/api/ambiental/expedientes/${expedienteId}/analisis`)
        .send({ resultado_llm_json: JSON.stringify({ nivel_riesgo: 'Alto' }) });
      expect(res.status).toBe(400);
    });

    test('JSON válido completo → 201 con analisis_id', async () => {
      if (!expedienteId) return;
      const res = await agent
        .post(`/api/ambiental/expedientes/${expedienteId}/analisis`)
        .send({ resultado_llm_json: llmJsonValido });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('analisis_id');
      analisisId = res.body.analisis_id;
    });

    test('expediente actualizado a estado Analizado tras guardar', async () => {
      if (!expedienteId) return;
      const res = await agent.get(`/api/ambiental/expedientes/${expedienteId}`);
      expect(res.status).toBe(200);
      expect(res.body.estado).toBe('Analizado');
      expect(res.body.admite_recurso).toBe('Sí');
      expect(res.body.que_ordena).toBeTruthy();
      expect(res.body.plazo_respuesta).toBeTruthy();
    });
  });

  // ── Análisis — obtener ────────────────────────────────────────────────────
  describe('GET /expedientes/:id/analisis', () => {
    test('→ 200 con hallazgos y normas_citadas', async () => {
      if (!expedienteId) return;
      const res = await agent.get(`/api/ambiental/expedientes/${expedienteId}/analisis`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('nivel_riesgo');
      expect(res.body).toHaveProperty('resumen');
      expect(Array.isArray(res.body.hallazgos)).toBe(true);
      expect(res.body.hallazgos.length).toBe(2);
      expect(Array.isArray(res.body.normas_citadas)).toBe(true);
      expect(res.body.normas_citadas.length).toBe(2);
    });

    test('hallazgos tienen campos requeridos', async () => {
      if (!expedienteId) return;
      const res = await agent.get(`/api/ambiental/expedientes/${expedienteId}/analisis`);
      const h = res.body.hallazgos[0];
      expect(h).toHaveProperty('tipo');
      expect(h).toHaveProperty('descripcion');
      expect(h).toHaveProperty('prioridad');
      expect(h).toHaveProperty('numero_hallazgo');
    });

    test('expediente sin análisis → 404', async () => {
      // Crear expediente sin análisis
      const { rows } = await pool.query(
        `INSERT INTO expedientes_ambientales (titulo, tipo_instrumento, creado_por)
         VALUES ('Sin Análisis', 'auto', $1) RETURNING id`,
        [testUserUuid]
      );
      const res = await agent.get(`/api/ambiental/expedientes/${rows[0].id}/analisis`);
      expect(res.status).toBe(404);
    });
  });

  // ── Datos informe ─────────────────────────────────────────────────────────
  describe('GET /expedientes/:id/informe', () => {
    test('→ 200 con expediente, análisis, hallazgos y normas_citadas', async () => {
      if (!expedienteId) return;
      const res = await agent.get(`/api/ambiental/expedientes/${expedienteId}/informe`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('expediente');
      expect(res.body).toHaveProperty('analisis');
      expect(Array.isArray(res.body.hallazgos)).toBe(true);
      expect(Array.isArray(res.body.normas_citadas)).toBe(true);
    });
  });

  // ── Borrado lógico ────────────────────────────────────────────────────────
  describe('DELETE /expedientes/:id', () => {
    test('→ 200 y expediente no aparece en listado', async () => {
      const { rows } = await pool.query(
        `INSERT INTO expedientes_ambientales (titulo, tipo_instrumento, creado_por)
         VALUES ('Para Borrar', 'expediente', $1) RETURNING id`,
        [testUserUuid]
      );
      const id = rows[0].id;

      const del = await agent.delete(`/api/ambiental/expedientes/${id}`);
      expect(del.status).toBe(200);

      const get = await agent.get(`/api/ambiental/expedientes/${id}`);
      expect(get.status).toBe(404);
    });

    test('id inexistente → 404', async () => {
      const res = await agent.delete('/api/ambiental/expedientes/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });
  });
});
