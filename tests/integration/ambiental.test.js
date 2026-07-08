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

    test('modo acumular — agrega hallazgos y registra seccion_index', async () => {
      if (!expedienteId) return;
      const seccionJson = JSON.stringify({
        que_ordena: null,
        admite_recurso: 'No',
        plazo_respuesta: null,
        fecha_vencimiento: '2026-10-01',
        nivel_riesgo: 'Medio',
        resumen: 'Sección adicional sin nuevos incumplimientos.',
        pagos: [],
        hallazgos: [
          {
            numero: 1,
            tipo: 'Observación',
            descripcion: 'Hallazgo de la sección 2.',
            norma_infringida: null,
            recomendacion: null,
            prioridad: 'Baja',
          },
        ],
        normas_citadas: [],
      });

      const res = await agent
        .post(`/api/ambiental/expedientes/${expedienteId}/analisis`)
        .send({ resultado_llm_json: seccionJson, modo: 'acumular', seccion_index: 2 });
      expect(res.status).toBe(201);

      // Hallazgos acumulados (2 del reemplazar inicial + 1 de esta sección)
      const analisis = await agent.get(`/api/ambiental/expedientes/${expedienteId}/analisis`);
      expect(analisis.body.hallazgos.length).toBe(3);

      // seccion_index registrado y smart merge aplicado
      const exp = await agent.get(`/api/ambiental/expedientes/${expedienteId}`);
      expect(exp.body.secciones_analizadas).toContain(2);
      expect(exp.body.fecha_vencimiento?.slice(0, 10)).toBe('2026-10-01');
      // admite_recurso original era 'Sí' → no debe sobreescribirse con 'No'
      expect(exp.body.admite_recurso).toBe('Sí');
    });

    test('modo acumular — smart merge actualiza admite_recurso si era Depende', async () => {
      if (!expedienteId) return;
      // Forzar admite_recurso a 'Depende' directamente en BD
      await pool.query(
        `UPDATE expedientes_ambientales SET admite_recurso = 'Depende' WHERE id = $1`,
        [expedienteId]
      );
      const seccionJson = JSON.stringify({
        que_ordena: null,
        admite_recurso: 'No',
        plazo_respuesta: null,
        fecha_vencimiento: null,
        nivel_riesgo: 'Bajo',
        resumen: 'Sin hallazgos.',
        pagos: [],
        hallazgos: [],
        normas_citadas: [],
      });

      const res = await agent
        .post(`/api/ambiental/expedientes/${expedienteId}/analisis`)
        .send({ resultado_llm_json: seccionJson, modo: 'acumular', seccion_index: 3 });
      expect(res.status).toBe(201);

      const exp = await agent.get(`/api/ambiental/expedientes/${expedienteId}`);
      expect(exp.body.admite_recurso).toBe('No');
      expect(exp.body.secciones_analizadas).toContain(3);
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
      expect(res.body.hallazgos.length).toBeGreaterThanOrEqual(2);
      expect(Array.isArray(res.body.normas_citadas)).toBe(true);
      expect(res.body.normas_citadas.length).toBeGreaterThanOrEqual(2);
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

  // ── Recurso — argumentos, selección de hallazgos y fecha_documento ────────
  describe('PATCH /expedientes/:id — campos de recurso y fecha_documento', () => {
    test('guardar argumentos_recurso → 200 y persiste', async () => {
      if (!expedienteId) return;
      const res = await agent
        .patch(`/api/ambiental/expedientes/${expedienteId}`)
        .send({ argumentos_recurso: 'La entidad cumplió parcialmente el PMA en el plazo otorgado.' });
      expect(res.status).toBe(200);

      const get = await agent.get(`/api/ambiental/expedientes/${expedienteId}`);
      expect(get.body.argumentos_recurso).toBe('La entidad cumplió parcialmente el PMA en el plazo otorgado.');
    });

    test('guardar argumentos_recurso vacío (borrar) → 200', async () => {
      if (!expedienteId) return;
      const res = await agent
        .patch(`/api/ambiental/expedientes/${expedienteId}`)
        .send({ argumentos_recurso: '' });
      expect(res.status).toBe(200);
    });

    test('guardar hallazgos_recurso_ids → 200 y persiste como array', async () => {
      if (!expedienteId || !analisisId) return;
      const { rows } = await pool.query(
        'SELECT id FROM hallazgos_ambientales WHERE analisis_id = $1 LIMIT 2',
        [analisisId]
      );
      const ids = rows.map(r => r.id);
      expect(ids.length).toBeGreaterThan(0);

      const res = await agent
        .patch(`/api/ambiental/expedientes/${expedienteId}`)
        .send({ hallazgos_recurso_ids: ids });
      expect(res.status).toBe(200);

      const get = await agent.get(`/api/ambiental/expedientes/${expedienteId}`);
      expect(Array.isArray(get.body.hallazgos_recurso_ids)).toBe(true);
      expect(get.body.hallazgos_recurso_ids).toEqual(expect.arrayContaining(ids));
    });

    test('hallazgos_recurso_ids con UUID inválido → 400', async () => {
      if (!expedienteId) return;
      const res = await agent
        .patch(`/api/ambiental/expedientes/${expedienteId}`)
        .send({ hallazgos_recurso_ids: ['no-es-uuid'] });
      expect(res.status).toBe(400);
    });

    test('limpiar selección → 200 y array vacío', async () => {
      if (!expedienteId) return;
      const res = await agent
        .patch(`/api/ambiental/expedientes/${expedienteId}`)
        .send({ hallazgos_recurso_ids: [] });
      expect(res.status).toBe(200);

      const get = await agent.get(`/api/ambiental/expedientes/${expedienteId}`);
      expect(get.body.hallazgos_recurso_ids).toEqual([]);
    });

    test('actualizar fecha_documento → 200 y persiste', async () => {
      if (!expedienteId) return;
      const res = await agent
        .patch(`/api/ambiental/expedientes/${expedienteId}`)
        .send({ fecha_documento: '2025-03-10' });
      expect(res.status).toBe(200);

      const get = await agent.get(`/api/ambiental/expedientes/${expedienteId}`);
      expect(get.body.fecha_documento).toMatch(/2025-03-10/);
    });
  });

  // ── Cierre de trámite ────────────────────────────────────────────────────
  describe('PATCH /expedientes/:id — estado Cerrado', () => {
    test('cerrar trámite → 200 y persiste', async () => {
      if (!expedienteId) return;
      const res = await agent
        .patch(`/api/ambiental/expedientes/${expedienteId}`)
        .send({ estado: 'Cerrado' });
      expect(res.status).toBe(200);
      expect(res.body.estado).toBe('Cerrado');
    });

    test('estado Cerrado persiste en GET', async () => {
      if (!expedienteId) return;
      const res = await agent.get(`/api/ambiental/expedientes/${expedienteId}`);
      expect(res.status).toBe(200);
      expect(res.body.estado).toBe('Cerrado');
    });

    test('reabrir expediente cambiando estado → 200', async () => {
      if (!expedienteId) return;
      const res = await agent
        .patch(`/api/ambiental/expedientes/${expedienteId}`)
        .send({ estado: 'Revisado' });
      expect(res.status).toBe(200);
      expect(res.body.estado).toBe('Revisado');
    });
  });

  // ── enlace_pdf ────────────────────────────────────────────────────────────
  describe('PATCH /expedientes/:id — enlace_pdf', () => {
    test('URL válida → 200 y persiste', async () => {
      if (!expedienteId) return;
      const res = await agent
        .patch(`/api/ambiental/expedientes/${expedienteId}`)
        .send({ enlace_pdf: 'https://example.com/documento.pdf' });
      expect(res.status).toBe(200);

      const get = await agent.get(`/api/ambiental/expedientes/${expedienteId}`);
      expect(get.body.enlace_pdf).toBe('https://example.com/documento.pdf');
    });

    test('URL inválida → 400', async () => {
      if (!expedienteId) return;
      const res = await agent
        .patch(`/api/ambiental/expedientes/${expedienteId}`)
        .send({ enlace_pdf: 'no-es-una-url' });
      expect(res.status).toBe(400);
    });

    test('vacío → 200 y borra el enlace', async () => {
      if (!expedienteId) return;
      const res = await agent
        .patch(`/api/ambiental/expedientes/${expedienteId}`)
        .send({ enlace_pdf: '' });
      expect(res.status).toBe(200);

      const get = await agent.get(`/api/ambiental/expedientes/${expedienteId}`);
      expect(get.body.enlace_pdf).toBeNull();
    });
  });

  // ── tipo_instrumento "otros" ───────────────────────────────────────────────
  describe('POST /expedientes — tipo_instrumento otros', () => {
    test('"otros" es tipo válido → 201', async () => {
      const res = await agent.post('/api/ambiental/expedientes').send({
        titulo: 'Documento tipo otros',
        tipo_instrumento: 'otros',
      });
      expect(res.status).toBe(201);
      expect(res.body.tipo_instrumento).toBe('otros');
    });
  });

  // ── Comunicaciones ────────────────────────────────────────────────────────
  describe('Comunicaciones del expediente', () => {
    let comId;

    test('GET /comunicaciones → 200 y array vacío inicial', async () => {
      if (!expedienteId) return;
      const res = await agent.get(`/api/ambiental/expedientes/${expedienteId}/comunicaciones`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('POST /comunicaciones sin asunto → 400', async () => {
      if (!expedienteId) return;
      const res = await agent
        .post(`/api/ambiental/expedientes/${expedienteId}/comunicaciones`)
        .field('direccion', 'entrante');
      expect(res.status).toBe(400);
    });

    test('POST /comunicaciones con texto → 201 con id', async () => {
      if (!expedienteId) return;
      const res = await agent
        .post(`/api/ambiental/expedientes/${expedienteId}/comunicaciones`)
        .field('asunto', 'Solicitud de información adicional')
        .field('direccion', 'entrante')
        .field('fecha', '2026-06-01')
        .field('descripcion', 'La entidad solicita complementar el informe.');
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      comId = res.body.id;
    });

    test('POST /comunicaciones con archivo TXT → 201 con texto_extraido', async () => {
      if (!expedienteId) return;
      const res = await agent
        .post(`/api/ambiental/expedientes/${expedienteId}/comunicaciones`)
        .field('asunto', 'Respuesta enviada')
        .field('direccion', 'saliente')
        .field('fecha', '2026-06-15')
        .attach('file', Buffer.from('Adjuntamos los soportes solicitados por la autoridad ambiental.'), 'respuesta.txt');
      expect(res.status).toBe(201);
      expect(res.body.texto_extraido).toContain('soportes');
    });

    test('GET /comunicaciones → lista incluye la creada', async () => {
      if (!expedienteId || !comId) return;
      const res = await agent.get(`/api/ambiental/expedientes/${expedienteId}/comunicaciones`);
      expect(res.status).toBe(200);
      expect(res.body.some(c => c.id === comId)).toBe(true);
    });

    test('DELETE /comunicaciones/:cId → 200 y desaparece del listado', async () => {
      if (!expedienteId || !comId) return;
      const del = await agent.delete(`/api/ambiental/expedientes/${expedienteId}/comunicaciones/${comId}`);
      expect(del.status).toBe(200);

      const get = await agent.get(`/api/ambiental/expedientes/${expedienteId}/comunicaciones`);
      expect(get.body.some(c => c.id === comId)).toBe(false);
    });

    test('GET /comunicaciones/inactivas → incluye la eliminada', async () => {
      if (!expedienteId || !comId) return;
      const res = await agent.get(`/api/ambiental/expedientes/${expedienteId}/comunicaciones/inactivas`);
      expect(res.status).toBe(200);
      expect(res.body.some(c => c.id === comId)).toBe(true);
    });

    test('PATCH /comunicaciones/:cId/reactivar → 200 y vuelve al listado', async () => {
      if (!expedienteId || !comId) return;
      const patch = await agent.patch(`/api/ambiental/expedientes/${expedienteId}/comunicaciones/${comId}/reactivar`);
      expect(patch.status).toBe(200);

      const get = await agent.get(`/api/ambiental/expedientes/${expedienteId}/comunicaciones`);
      expect(get.body.some(c => c.id === comId)).toBe(true);
    });

    test('DELETE id inexistente → 404', async () => {
      if (!expedienteId) return;
      const res = await agent.delete(`/api/ambiental/expedientes/${expedienteId}/comunicaciones/00000000-0000-0000-0000-000000000000`);
      expect(res.status).toBe(404);
    });

    test('POST /comunicaciones con enlace → 201 y enlace persiste', async () => {
      if (!expedienteId) return;
      const res = await agent
        .post(`/api/ambiental/expedientes/${expedienteId}/comunicaciones`)
        .field('asunto', 'Oficio con enlace')
        .field('direccion', 'saliente')
        .field('fecha', '2026-07-01')
        .field('enlace', 'https://example.com/oficio.pdf');
      expect(res.status).toBe(201);
      expect(res.body.enlace).toBe('https://example.com/oficio.pdf');
    });

    test('PATCH /comunicaciones/:cId/enlace → 200 y persiste', async () => {
      if (!expedienteId) return;
      // crear comunicación base
      const post = await agent
        .post(`/api/ambiental/expedientes/${expedienteId}/comunicaciones`)
        .field('asunto', 'Para enlace')
        .field('direccion', 'entrante')
        .field('fecha', '2026-07-02');
      expect(post.status).toBe(201);
      const cId = post.body.id;

      const patch = await agent
        .patch(`/api/ambiental/expedientes/${expedienteId}/comunicaciones/${cId}/enlace`)
        .send({ enlace: 'https://example.com/doc.pdf' });
      expect(patch.status).toBe(200);
      expect(patch.body.enlace).toBe('https://example.com/doc.pdf');

      const list = await agent.get(`/api/ambiental/expedientes/${expedienteId}/comunicaciones`);
      const com = list.body.find(c => c.id === cId);
      expect(com.enlace).toBe('https://example.com/doc.pdf');
    });

    test('PATCH /comunicaciones/:cId/enlace vacío → 200 y borra enlace', async () => {
      if (!expedienteId) return;
      const post = await agent
        .post(`/api/ambiental/expedientes/${expedienteId}/comunicaciones`)
        .field('asunto', 'Para borrar enlace')
        .field('direccion', 'entrante')
        .field('fecha', '2026-07-03')
        .field('enlace', 'https://example.com/tmp.pdf');
      const cId = post.body.id;

      const patch = await agent
        .patch(`/api/ambiental/expedientes/${expedienteId}/comunicaciones/${cId}/enlace`)
        .send({ enlace: '' });
      expect(patch.status).toBe(200);
      expect(patch.body.enlace).toBeNull();
    });
  });

  // ── Análisis LLM de comunicación ──────────────────────────────────────────
  describe('Análisis LLM de comunicación (prompt-analisis / resultado-llm)', () => {
    let comConTextoId;

    beforeAll(async () => {
      if (!expedienteId) return;
      // crear comunicación con texto extraído para poder generar prompt
      const res = await agent
        .post(`/api/ambiental/expedientes/${expedienteId}/comunicaciones`)
        .field('asunto', 'Resolución sancionatoria')
        .field('direccion', 'entrante')
        .field('fecha', '2026-07-05')
        .attach('file', Buffer.from('La autoridad ambiental resuelve imponer medida preventiva.'), 'resolucion.txt');
      if (res.status === 201) comConTextoId = res.body.id;
    });

    test('POST /prompt-analisis sin texto_extraido → 400', async () => {
      if (!expedienteId) return;
      const postSinTexto = await agent
        .post(`/api/ambiental/expedientes/${expedienteId}/comunicaciones`)
        .field('asunto', 'Sin archivo')
        .field('direccion', 'entrante')
        .field('fecha', '2026-07-06');
      const cId = postSinTexto.body.id;

      const res = await agent.post(`/api/ambiental/expedientes/${expedienteId}/comunicaciones/${cId}/prompt-analisis`);
      expect(res.status).toBe(422);
    });

    test('POST /prompt-analisis id inexistente → 404', async () => {
      if (!expedienteId) return;
      const res = await agent.post(`/api/ambiental/expedientes/${expedienteId}/comunicaciones/00000000-0000-0000-0000-000000000000/prompt-analisis`);
      expect(res.status).toBe(404);
    });

    test('POST /prompt-analisis con texto_extraido → 200 con prompt', async () => {
      if (!expedienteId || !comConTextoId) return;
      const res = await agent.post(`/api/ambiental/expedientes/${expedienteId}/comunicaciones/${comConTextoId}/prompt-analisis`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('prompt');
      expect(typeof res.body.prompt).toBe('string');
      expect(res.body.prompt.length).toBeGreaterThan(50);
    });

    test('PATCH /resultado-llm sin resultado → 400', async () => {
      if (!expedienteId || !comConTextoId) return;
      const res = await agent
        .patch(`/api/ambiental/expedientes/${expedienteId}/comunicaciones/${comConTextoId}/resultado-llm`)
        .send({});
      expect(res.status).toBe(400);
    });

    test('PATCH /resultado-llm → 200 y persiste en listado', async () => {
      if (!expedienteId || !comConTextoId) return;
      const resultado = JSON.stringify({
        valoracion: 'Desfavorable',
        cumplimiento: 'Incumplimiento',
        resumen: 'La autoridad impone medida preventiva por incumplimiento.',
        procede_recurso: 'Sí',
        tipo_recurso: 'Reposición',
        fundamentos_recurso: 'Art. 85 Ley 99/93',
        plazo_recurso: '10 días hábiles',
        recomendaciones: ['Interponer recurso de reposición'],
        observaciones: '',
      });

      const res = await agent
        .patch(`/api/ambiental/expedientes/${expedienteId}/comunicaciones/${comConTextoId}/resultado-llm`)
        .send({ resultado_llm: resultado });
      expect(res.status).toBe(200);

      const list = await agent.get(`/api/ambiental/expedientes/${expedienteId}/comunicaciones`);
      const com = list.body.find(c => c.id === comConTextoId);
      expect(com.resultado_llm).toBe(resultado);
    });
  });

  // ── Precedentes — embeddings y búsqueda híbrida ──────────────────────────
  describe('Precedentes — embeddings y similares', () => {
    // Vector 384 dims normalizado (todos iguales → similitud 1.0 entre sí)
    const vectorFake = `[${Array(384).fill((1 / Math.sqrt(384)).toFixed(8)).join(',')}]`;

    let expedienteConEmb;  // expediente fuente con embedding
    let expedientePar;     // segundo expediente con contenido similar para RRF

    beforeAll(async () => {
      // Expediente fuente con texto rico para full-text
      const { rows: r1 } = await pool.query(
        `INSERT INTO expedientes_ambientales
           (titulo, tipo_instrumento, contenido_texto, que_ordena, creado_por)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          'Resolución Plan de Manejo Ambiental Ley 99',
          'Resolución Sancionatoria',
          'Se ordena la presentación del Plan de Manejo Ambiental. Incumplimiento Ley 99/93 artículo 49.',
          'Presentar Plan de Manejo Ambiental en 30 días.',
          testUserUuid,
        ]
      );
      expedienteConEmb = r1[0].id;

      // Expediente par con contenido similar
      const { rows: r2 } = await pool.query(
        `INSERT INTO expedientes_ambientales
           (titulo, tipo_instrumento, contenido_texto, que_ordena, creado_por)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          'Auto sancionatorio Plan de Manejo Ambiental',
          'Auto',
          'Incumplimiento de la presentación del Plan de Manejo Ambiental conforme Ley 99/93.',
          'Subsanar incumplimiento Ley 99/93 en 15 días.',
          testUserUuid,
        ]
      );
      expedientePar = r2[0].id;

      // Insertar embeddings fake directamente (bypassa el modelo Xenova que falla en Jest)
      await pool.query(
        `INSERT INTO embeddings_ambiental (expediente_id, embedding, fuente)
         VALUES ($1, $2, 'contenido'), ($3, $2, 'contenido')`,
        [expedienteConEmb, vectorFake, expedientePar]
      );
    });

    afterAll(async () => {
      await pool.query(
        'DELETE FROM expedientes_ambientales WHERE id = ANY($1::uuid[])',
        [[expedienteConEmb, expedientePar].filter(Boolean)]
      );
    });

    test('GET /similares sin embedding → 404', async () => {
      const { rows } = await pool.query(
        `INSERT INTO expedientes_ambientales (titulo, tipo_instrumento, creado_por)
         VALUES ('Sin Embedding', 'Concepto', $1) RETURNING id`,
        [testUserUuid]
      );
      const sinEmbId = rows[0].id;
      const res = await agent.get(`/api/ambiental/expedientes/${sinEmbId}/similares`);
      expect(res.status).toBe(404);
      await pool.query('DELETE FROM expedientes_ambientales WHERE id = $1', [sinEmbId]);
    });

    test('POST /generar-embedding → 200 con fuente', async () => {
      if (!expedienteConEmb) return;
      // El modelo Xenova falla en Jest — guardarEmbedding swallows el error y retorna
      // El controller igual responde 200 con la fuente calculada
      const res = await agent.post(`/api/ambiental/expedientes/${expedienteConEmb}/generar-embedding`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('fuente');
    });

    test('POST /generar-embedding id inexistente → 404', async () => {
      const res = await agent.post('/api/ambiental/expedientes/00000000-0000-0000-0000-000000000000/generar-embedding');
      expect(res.status).toBe(404);
    });

    test('GET /similares con embedding → 200 con campos RRF', async () => {
      if (!expedienteConEmb) return;
      const res = await agent.get(`/api/ambiental/expedientes/${expedienteConEmb}/similares`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // expedientePar tiene embedding y contenido similar → debe aparecer
      expect(res.body.length).toBeGreaterThan(0);
      const primero = res.body[0];
      expect(primero).toHaveProperty('id');
      expect(primero).toHaveProperty('titulo');
      expect(primero).toHaveProperty('similitud');
      expect(primero).toHaveProperty('rrf_score');
    });

    test('GET /similares respeta el parámetro limite', async () => {
      if (!expedienteConEmb) return;
      const res = await agent.get(`/api/ambiental/expedientes/${expedienteConEmb}/similares?limite=1`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBeLessThanOrEqual(1);
    });

    test('GET /similares — fallback a vectorial cuando expediente no tiene texto', async () => {
      // Expediente sin titulo útil ni contenido — textoFT quedará vacío → fallback vectorial
      const { rows } = await pool.query(
        `INSERT INTO expedientes_ambientales (titulo, tipo_instrumento, creado_por)
         VALUES ('X', 'Concepto', $1) RETURNING id`,
        [testUserUuid]
      );
      const sinTextoId = rows[0].id;

      await pool.query(
        `INSERT INTO embeddings_ambiental (expediente_id, embedding, fuente) VALUES ($1, $2, 'contenido')`,
        [sinTextoId, vectorFake]
      );

      // Sin texto útil → plainto_tsquery no se invoca → no lanza error
      const res = await agent.get(`/api/ambiental/expedientes/${sinTextoId}/similares`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      await pool.query('DELETE FROM expedientes_ambientales WHERE id = $1', [sinTextoId]);
    });

    test('POST /prompt-comparativo sin precedentes_ids → 400', async () => {
      if (!expedienteConEmb) return;
      const res = await agent
        .post(`/api/ambiental/expedientes/${expedienteConEmb}/prompt-comparativo`)
        .send({ precedentes_ids: [] });
      expect(res.status).toBe(400);
    });

    test('POST /prompt-comparativo expediente inexistente → 404', async () => {
      const res = await agent
        .post('/api/ambiental/expedientes/00000000-0000-0000-0000-000000000000/prompt-comparativo')
        .send({ precedentes_ids: ['00000000-0000-0000-0000-000000000001'] });
      expect(res.status).toBe(404);
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
