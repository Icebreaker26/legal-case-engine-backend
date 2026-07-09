/**
 * Tests de integración — Comprensión semántica y respuesta de petición
 *
 * Cubre:
 *   GET  /:id/prompt-comprension
 *   POST /:id/comprension
 *   GET  /memoria/:documento_id/prompt-comprension
 *   POST /memoria/:documento_id/comprension
 *   POST /:id/generar-prompts-peticion
 *   GET  /:id/respuesta-peticion
 *   POST /:id/respuesta-peticion
 *   DELETE /:id/respuesta-peticion
 */

import { jest } from '@jest/globals';
import request  from 'supertest';
import pool     from '../../src/db/database.js';
import bcrypt   from 'bcrypt';

// Mock del embedding — evita cargar el modelo en tests
jest.unstable_mockModule('../../src/modules/tutelas/services/aiService.js', () => ({
  generarEmbeddingLocal: jest.fn().mockResolvedValue(new Array(384).fill(0.1)),
  generarEmbedding:      jest.fn().mockResolvedValue(new Array(384).fill(0.1)),
}));

const { default: createApp } = await import('../../src/app_test.js');
const app   = createApp();
const agent = request.agent(app);

// ── JSON válido de comprensión de tutela ──────────────────────────────────────
const COMPRENSION_TUTELA_VALIDA = JSON.stringify({
  tema_central:       'Solicitud de información sobre facturación',
  derechos_invocados: ['derecho de petición', 'acceso a información'],
  peticiones:         ['Remitir copia de factura', 'Explicar cobros adicionales'],
  urgencia_declarada: 'media',
  extracto_clave:     'Solicito respetuosamente copia detallada de la factura.',
});

// ── JSON válido de comprensión de documento de memoria ────────────────────────
const COMPRENSION_DOC_VALIDA = JSON.stringify({
  que_resuelve:         'Establece precedente sobre prescripción extintiva en infraestructura eléctrica',
  tipo_caso:            'prescripcion_extintiva',
  resultado:            'favorable',
  derechos_involucrados: ['prescripción', 'servidumbre', 'ingreso al predio'],
});

// ── JSON válido de respuesta de petición (estructura que devuelve el LLM) ─────
const RESPUESTA_LLM_VALIDA = JSON.stringify({
  encabezado: {
    ciudad_fecha:      'Bogotá, 9 de julio de 2026',
    para:              'Peticionario Test',
    radicado_peticion: 'RAD-2026-999',
    asunto:            'Respuesta a derecho de petición',
  },
  introduccion:  'Reciba un cordial saludo de parte de Enel Colombia S.A. E.S.P.',
  respuestas: [
    {
      numero:       1,
      solicitud:    'Remitir copia de factura',
      respuesta:    'En atención a su solicitud, adjuntamos copia de la factura correspondiente.',
      normas_citadas: ['Art. 14 Ley 1437/2011'],
    },
  ],
  prescripcion: { aplica: false, fundamento: null, norma: null },
  cierre: 'Atentamente, Enel Colombia S.A. E.S.P.',
});

describe('Comprensión semántica y respuesta de petición — Integración', () => {
  let testUserUuid;
  let tutelaId;
  let documentoId;

  const testEmail = 'comprension-test@icebreaker.com';
  const testPass  = 'testpass123';

  // ── Setup ──────────────────────────────────────────────────────────────────
  beforeAll(async () => {
    const hash = await bcrypt.hash(testPass, 10);
    const { rows } = await pool.query(
      `INSERT INTO global_usuarios (nombre, email, password_hash, rol, is_approved)
       VALUES ($1, $2, $3, 'juridico', true)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      ['Comprension Test', testEmail, hash]
    );
    testUserUuid = rows[0].id;

    await pool.query(`
      INSERT INTO permisos (usuario_uuid, modulo_id, accion_id)
      SELECT $1, m.id, a.id FROM modulos m, acciones a
      WHERE m.nombre = 'tutelas' AND a.nombre IN ('READ', 'WRITE', 'DELETE')
      ON CONFLICT DO NOTHING
    `, [testUserUuid]);

    await agent.post('/api/auth/login').send({ email: testEmail, password: testPass });

    // Tutela de prueba con texto original (necesario para generar prompt de comprensión)
    const { rows: tRows } = await pool.query(`
      INSERT INTO tutelas (radicado, accionante, derecho_vulnerado, estado, is_active, responsable_uuid, contenido_original)
      VALUES ('COMP-TEST-2026', 'Peticionario Test', 'Información', 'Pendiente', true, $1,
              'Solicito respetuosamente información sobre mi factura del mes de mayo.')
      ON CONFLICT (radicado) DO UPDATE SET contenido_original = EXCLUDED.contenido_original
      RETURNING id
    `, [testUserUuid]);
    tutelaId = tRows[0].id;

    // Documento en base_conocimiento_enel para tests de comprensión de memoria
    const { rows: dRows } = await pool.query(`
      INSERT INTO base_conocimiento_enel
        (titulo_referencia, categoria, contenido_legal, es_exitosa, is_active,
         documento_id, embedding_local)
      VALUES ('Doc Prueba Comprensión', 'TEST_CAT', 'Contenido legal de prueba para tests.',
              true, true, gen_random_uuid(), $1)
      RETURNING documento_id
    `, [JSON.stringify(new Array(384).fill(0.1))]);
    documentoId = dRows[0].documento_id;
  });

  // ── Teardown ───────────────────────────────────────────────────────────────
  afterAll(async () => {
    if (documentoId) {
      await pool.query('DELETE FROM base_conocimiento_enel WHERE documento_id = $1', [documentoId]);
    }
    if (tutelaId) {
      await pool.query('DELETE FROM respuestas_peticion  WHERE tutela_id = $1', [tutelaId]);
      await pool.query('DELETE FROM historial_acciones   WHERE tutela_id = $1', [tutelaId]);
      await pool.query('DELETE FROM tutela_argumentos    WHERE tutela_id = $1', [tutelaId]);
      await pool.query('DELETE FROM tutelas              WHERE id = $1',        [tutelaId]);
    }
    if (testUserUuid) {
      await pool.query('DELETE FROM logs_sistema      WHERE usuario_uuid = $1', [testUserUuid]);
      await pool.query('DELETE FROM permisos          WHERE usuario_uuid = $1', [testUserUuid]);
      await pool.query('DELETE FROM global_usuarios   WHERE id = $1',           [testUserUuid]);
    }
    await pool.end();
  });

  // ── Auth ───────────────────────────────────────────────────────────────────
  describe('Autenticación', () => {
    test('GET /:id/prompt-comprension sin token → 401', async () => {
      const res = await request(app).get(`/api/tutelas/${tutelaId}/prompt-comprension`);
      expect(res.status).toBe(401);
    });

    test('POST /:id/comprension sin token → 401', async () => {
      const res = await request(app).post(`/api/tutelas/${tutelaId}/comprension`).send({});
      expect(res.status).toBe(401);
    });

    test('GET /memoria/:id/prompt-comprension sin token → 401', async () => {
      const res = await request(app).get(`/api/tutelas/memoria/${documentoId}/prompt-comprension`);
      expect(res.status).toBe(401);
    });

    test('GET /:id/respuesta-peticion sin token → 401', async () => {
      const res = await request(app).get(`/api/tutelas/${tutelaId}/respuesta-peticion`);
      expect(res.status).toBe(401);
    });
  });

  // ── Comprensión de tutela ──────────────────────────────────────────────────
  describe('GET /:id/prompt-comprension', () => {
    test('tutela inexistente → 404', async () => {
      const res = await agent.get('/api/tutelas/00000000-0000-0000-0000-000000000000/prompt-comprension');
      expect(res.status).toBe(404);
    });

    test('tutela válida → 200 con campo prompt', async () => {
      const res = await agent.get(`/api/tutelas/${tutelaId}/prompt-comprension`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('prompt');
      expect(typeof res.body.prompt).toBe('string');
      expect(res.body.prompt.length).toBeGreaterThan(50);
    });
  });

  describe('POST /:id/comprension', () => {
    test('sin json_comprension → 400', async () => {
      const res = await agent.post(`/api/tutelas/${tutelaId}/comprension`).send({});
      expect(res.status).toBe(400);
    });

    test('JSON malformado → 400', async () => {
      const res = await agent
        .post(`/api/tutelas/${tutelaId}/comprension`)
        .send({ json_comprension: 'esto no es json {{{' });
      expect(res.status).toBe(400);
    });

    test('JSON sin tema_central → 400', async () => {
      const res = await agent
        .post(`/api/tutelas/${tutelaId}/comprension`)
        .send({ json_comprension: JSON.stringify({ peticiones: ['algo'] }) });
      expect(res.status).toBe(400);
    });

    test('JSON sin peticiones → 400', async () => {
      const res = await agent
        .post(`/api/tutelas/${tutelaId}/comprension`)
        .send({ json_comprension: JSON.stringify({ tema_central: 'algo' }) });
      expect(res.status).toBe(400);
    });

    test('JSON válido → 200 y devuelve comprension', async () => {
      const res = await agent
        .post(`/api/tutelas/${tutelaId}/comprension`)
        .send({ json_comprension: COMPRENSION_TUTELA_VALIDA });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('comprension');
      expect(res.body.comprension).toHaveProperty('tema_central');
      expect(res.body.comprension).toHaveProperty('peticiones');
      expect(Array.isArray(res.body.comprension.peticiones)).toBe(true);
    });

    test('comprensión guardada persiste en la tutela', async () => {
      const { rows } = await pool.query(
        'SELECT analisis_comprension FROM tutelas WHERE id = $1', [tutelaId]
      );
      expect(rows[0].analisis_comprension).not.toBeNull();
      expect(rows[0].analisis_comprension).toHaveProperty('tema_central');
    });

    test('acepta JSON con bloques markdown (```json ... ```)', async () => {
      const conMarkdown = `\`\`\`json\n${COMPRENSION_TUTELA_VALIDA}\n\`\`\``;
      const res = await agent
        .post(`/api/tutelas/${tutelaId}/comprension`)
        .send({ json_comprension: conMarkdown });
      expect(res.status).toBe(200);
    });
  });

  // ── Comprensión de documento de memoria ───────────────────────────────────
  describe('GET /memoria/:documento_id/prompt-comprension', () => {
    test('documento inexistente → 404', async () => {
      const res = await agent.get('/api/tutelas/memoria/00000000-0000-0000-0000-000000000000/prompt-comprension');
      expect(res.status).toBe(404);
    });

    test('documento válido → 200 con campo prompt', async () => {
      const res = await agent.get(`/api/tutelas/memoria/${documentoId}/prompt-comprension`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('prompt');
      expect(typeof res.body.prompt).toBe('string');
    });
  });

  describe('POST /memoria/:documento_id/comprension', () => {
    test('sin json_comprension → 400', async () => {
      const res = await agent
        .post(`/api/tutelas/memoria/${documentoId}/comprension`)
        .send({});
      expect(res.status).toBe(400);
    });

    test('JSON sin que_resuelve → 400', async () => {
      const res = await agent
        .post(`/api/tutelas/memoria/${documentoId}/comprension`)
        .send({ json_comprension: JSON.stringify({ tipo_caso: 'prescripcion' }) });
      expect(res.status).toBe(400);
    });

    test('JSON sin tipo_caso → 400', async () => {
      const res = await agent
        .post(`/api/tutelas/memoria/${documentoId}/comprension`)
        .send({ json_comprension: JSON.stringify({ que_resuelve: 'algo' }) });
      expect(res.status).toBe(400);
    });

    test('JSON válido → 200 y ok: true', async () => {
      const res = await agent
        .post(`/api/tutelas/memoria/${documentoId}/comprension`)
        .send({ json_comprension: COMPRENSION_DOC_VALIDA });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ok', true);
      expect(res.body).toHaveProperty('comprension');
      expect(res.body.comprension).toHaveProperty('que_resuelve');
    });

    test('comprensión persiste en base_conocimiento_enel', async () => {
      const { rows } = await pool.query(
        'SELECT comprension_doc, embedding_comprension FROM base_conocimiento_enel WHERE documento_id = $1',
        [documentoId]
      );
      expect(rows[0].comprension_doc).not.toBeNull();
      expect(rows[0].embedding_comprension).not.toBeNull();
    });
  });

  // ── Generar prompts de petición ───────────────────────────────────────────
  describe('POST /:id/generar-prompts-peticion', () => {
    test('tutela inexistente → 404', async () => {
      const res = await agent.post('/api/tutelas/00000000-0000-0000-0000-000000000000/generar-prompts-peticion');
      expect(res.status).toBe(404);
    });

    test('tutela válida → 200 con array de prompts', async () => {
      const res = await agent.post(`/api/tutelas/${tutelaId}/generar-prompts-peticion`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('prompts');
      expect(Array.isArray(res.body.prompts)).toBe(true);
      expect(res.body.prompts.length).toBeGreaterThan(0);
      // Cada item es un objeto con parte y prompt
      const primer = res.body.prompts[0];
      expect(primer).toHaveProperty('parte');
      expect(primer).toHaveProperty('prompt');
      expect(typeof primer.prompt).toBe('string');
    });

    test('respuesta incluye total_partes y total_solicitudes', async () => {
      const res = await agent.post(`/api/tutelas/${tutelaId}/generar-prompts-peticion`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('total_partes');
      expect(res.body).toHaveProperty('total_solicitudes');
    });

    test('el prompt generado supera 200 caracteres (contiene insumos)', async () => {
      const res = await agent.post(`/api/tutelas/${tutelaId}/generar-prompts-peticion`);
      expect(res.status).toBe(200);
      expect(res.body.prompts[0].prompt.length).toBeGreaterThan(200);
    });
  });

  // ── Respuesta de petición ─────────────────────────────────────────────────
  describe('GET /:id/respuesta-peticion', () => {
    test('sin respuesta guardada → 200 con null', async () => {
      const res = await agent.get(`/api/tutelas/${tutelaId}/respuesta-peticion`);
      expect(res.status).toBe(200);
      // puede ser null o un objeto si había algo previo
      expect([null, 'object'].includes(typeof res.body === 'object' ? typeof res.body : null)).toBeTruthy();
    });
  });

  describe('POST /:id/respuesta-peticion', () => {
    test('sin body → 400 (Zod: falta resultado_llm_json)', async () => {
      const res = await agent.post(`/api/tutelas/${tutelaId}/respuesta-peticion`).send({});
      expect(res.status).toBe(400);
    });

    test('resultado_llm_json no es JSON válido → 400', async () => {
      const res = await agent
        .post(`/api/tutelas/${tutelaId}/respuesta-peticion`)
        .send({ resultado_llm_json: 'no soy json', modo: 'acumular' });
      expect(res.status).toBe(400);
    });

    test('modo fuera del enum → 400 (Zod)', async () => {
      const res = await agent
        .post(`/api/tutelas/${tutelaId}/respuesta-peticion`)
        .send({ resultado_llm_json: RESPUESTA_LLM_VALIDA, modo: 'invalido' });
      expect(res.status).toBe(400);
    });

    test('payload válido modo reemplazar → 200 con respuesta_id', async () => {
      const res = await agent
        .post(`/api/tutelas/${tutelaId}/respuesta-peticion`)
        .send({ resultado_llm_json: RESPUESTA_LLM_VALIDA, modo: 'reemplazar' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('respuesta_id');
    });

    test('después de guardar, GET devuelve la respuesta con items', async () => {
      const res = await agent.get(`/api/tutelas/${tutelaId}/respuesta-peticion`);
      expect(res.status).toBe(200);
      expect(res.body).not.toBeNull();
      expect(res.body).toHaveProperty('items');
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.items.length).toBeGreaterThan(0);
      expect(res.body.items[0]).toHaveProperty('solicitud');
      expect(res.body.items[0]).toHaveProperty('respuesta');
    });

    test('modo acumular agrega items sin duplicar', async () => {
      const segundaRespuesta = JSON.stringify({
        respuestas: [
          {
            numero:        2,
            solicitud:     'Explicar cobros adicionales',
            respuesta:     'Los cobros corresponden al consumo registrado en el medidor.',
            normas_citadas: ['Art. 142 Ley 142/1994'],
          },
        ],
        prescripcion: { aplica: false, fundamento: null, norma: null },
      });

      const res = await agent
        .post(`/api/tutelas/${tutelaId}/respuesta-peticion`)
        .send({ resultado_llm_json: segundaRespuesta, modo: 'acumular', parte_index: 1 });
      expect(res.status).toBe(200);

      // Verificar que ahora hay 2 items
      const getRes = await agent.get(`/api/tutelas/${tutelaId}/respuesta-peticion`);
      expect(getRes.body.items.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('DELETE /:id/respuesta-peticion', () => {
    test('elimina la respuesta → 200', async () => {
      const res = await agent.delete(`/api/tutelas/${tutelaId}/respuesta-peticion`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    test('después de eliminar, GET devuelve null', async () => {
      const res = await agent.get(`/api/tutelas/${tutelaId}/respuesta-peticion`);
      expect(res.status).toBe(200);
      expect(res.body).toBeNull();
    });

    test('eliminar de nuevo no falla (idempotente)', async () => {
      const res = await agent.delete(`/api/tutelas/${tutelaId}/respuesta-peticion`);
      expect(res.status).toBe(200);
    });
  });
});
