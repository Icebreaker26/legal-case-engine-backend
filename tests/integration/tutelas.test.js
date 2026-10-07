import request from 'supertest';
import createApp from '../../src/app_test.js';
import pool from '../../src/db/database.js';
import bcrypt from 'bcrypt';
import { registrarImpresiones } from '../../src/modules/tutelas/services/consultaService.js';

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

    // #108: gate de confirmación de categoría antes de promover a memoria legal
    test('POST /:id/argumentos/:argId/promover SIN categoria_confirmada → 400', async () => {
      if (!argumentoId) return;
      const res = await agent
        .post(`/api/tutelas/${tutelaId}/argumentos/${argumentoId}/promover`)
        .send({});
      expect(res.status).toBe(400);
    });

    test('POST /:id/argumentos/:argId/promover CON categoria_confirmada=true → no lo rechaza por el gate', async () => {
      if (!argumentoId) return;
      const res = await agent
        .post(`/api/tutelas/${tutelaId}/argumentos/${argumentoId}/promover`)
        .send({ categoria_confirmada: true });
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

  // ── Gate de confirmación de categoría antes de promover (#108) ─────────────
  describe('PATCH /:id/datos — promoción a memoria legal requiere categoria_confirmada', () => {
    beforeAll(async () => {
      await agent.post(`/api/tutelas/${tutelaId}/lock`); // actualizarBorrador exige lock_owner_id
      const borrador = await agent
        .patch(`/api/tutelas/${tutelaId}/borrador`)
        .send({ contestacion_generada: 'Contestación de prueba para #108.' });
      if (borrador.status !== 200) throw new Error(`Setup falló: PATCH /borrador → ${borrador.status} ${JSON.stringify(borrador.body)}`);
      await pool.query('UPDATE tutelas SET respuesta_promovida = FALSE WHERE id = $1', [tutelaId]);
    });

    test('resultado_fallo=Favorable SIN categoria_confirmada → no promueve, avisa que está pendiente', async () => {
      const res = await agent
        .patch(`/api/tutelas/${tutelaId}/datos`)
        .send({ resultado_fallo: 'Favorable' });
      expect(res.status).toBe(200);
      expect(res.body.promocion_pendiente).toBe(true);

      const { rows } = await pool.query('SELECT respuesta_promovida FROM tutelas WHERE id = $1', [tutelaId]);
      expect(rows[0].respuesta_promovida).toBe(false);
    });

    test('resultado_fallo=Favorable CON categoria_confirmada=true → intenta promover (no queda pendiente)', async () => {
      const res = await agent
        .patch(`/api/tutelas/${tutelaId}/datos`)
        .send({ resultado_fallo: 'Favorable', categoria_confirmada: true });
      expect(res.status).toBe(200);
      expect(res.body.promocion_pendiente).toBeUndefined();
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

    // #124 — cobertura de embedding_comprension (fallback a embedding_local)
    describe('GET /memoria/cobertura-comprension', () => {
      const CATEGORIA_COBERTURA = 'COBERTURA_COMPRENSION_TEST';
      const docConComprension = 'cccccccc-0000-0000-0000-000000000001';
      const docSinComprension = 'cccccccc-0000-0000-0000-000000000002';

      beforeAll(async () => {
        await pool.query(
          `INSERT INTO base_conocimiento_enel
             (categoria, titulo_referencia, contenido_legal, embedding_local, es_exitosa, is_active, documento_id, comprension_doc, embedding_comprension)
           VALUES ($1, 'Doc con comprensión', 'texto', $2, TRUE, TRUE, $3, $4, $2)`,
          [CATEGORIA_COBERTURA, JSON.stringify(Array(384).fill(0.1)), docConComprension, JSON.stringify({ que_resuelve: 'x', tipo_caso: 'y' })]
        );
        await pool.query(
          // created_at deliberadamente antiquísimo: garantiza el puesto en el
          // LIMIT 10 global de "más antiguos", sin depender de qué otra data
          // de seed ya exista en la base de pruebas.
          `INSERT INTO base_conocimiento_enel
             (categoria, titulo_referencia, contenido_legal, embedding_local, es_exitosa, is_active, documento_id, created_at)
           VALUES ($1, 'Doc sin comprensión', 'texto', $2, TRUE, TRUE, $3, '2000-01-01'::timestamptz)`,
          [CATEGORIA_COBERTURA, JSON.stringify(Array(384).fill(0.1)), docSinComprension]
        );
      });

      afterAll(async () => {
        await pool.query('DELETE FROM base_conocimiento_enel WHERE categoria = $1', [CATEGORIA_COBERTURA]);
      });

      test('200 con el resumen agregado', async () => {
        const res = await agent.get('/api/tutelas/memoria/cobertura-comprension');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('total');
        expect(res.body).toHaveProperty('con_comprension');
        expect(res.body).toHaveProperty('sin_comprension');
        expect(Array.isArray(res.body.por_categoria)).toBe(true);
        expect(Array.isArray(res.body.mas_antiguos_sin_comprension)).toBe(true);
      });

      test('con_comprension + sin_comprension == total', async () => {
        const res = await agent.get('/api/tutelas/memoria/cobertura-comprension');
        expect(Number(res.body.con_comprension) + Number(res.body.sin_comprension)).toBe(Number(res.body.total));
      });

      test('la categoría de prueba refleja exactamente 1 con comprensión y 1 sin ella', async () => {
        const res = await agent.get('/api/tutelas/memoria/cobertura-comprension');
        const fila = res.body.por_categoria.find(c => c.categoria === CATEGORIA_COBERTURA);
        expect(fila).toBeDefined();
        expect(Number(fila.total)).toBe(2);
        expect(Number(fila.con_comprension)).toBe(1);
        expect(Number(fila.sin_comprension)).toBe(1);
      });

      test('el documento sin comprensión aparece en mas_antiguos_sin_comprension', async () => {
        const res = await agent.get('/api/tutelas/memoria/cobertura-comprension');
        const ids = res.body.mas_antiguos_sin_comprension.map(d => d.documento_id);
        expect(ids).toContain(docSinComprension);
        expect(ids).not.toContain(docConComprension);
      });

      test('sin token → 401', async () => {
        const res = await request(app).get('/api/tutelas/memoria/cobertura-comprension');
        expect(res.status).toBe(401);
      });
    });
  });

  // #165 — ECCP fases (b)+(c): tabla feedback_precedentes + instrumentación
  // de impresiones, sin cambiar el ranking.
  describe('ECCP — feedback_precedentes e impresiones_precedentes (#165)', () => {
    const CATEGORIA_ECCP = 'ECCP_TEST';
    const docEccp = 'eccccccc-0000-0000-0000-000000000001';
    let tutelaEccpId;

    beforeAll(async () => {
      await pool.query(
        `INSERT INTO base_conocimiento_enel
           (categoria, titulo_referencia, contenido_legal, embedding_local, es_exitosa, is_active, documento_id)
         VALUES ($1, 'Doc ECCP', 'contenido de prueba para ECCP', $2, TRUE, TRUE, $3)`,
        [CATEGORIA_ECCP, JSON.stringify(Array(384).fill(0.1)), docEccp]
      );

      const { rows } = await pool.query(`
        INSERT INTO tutelas (radicado, accionante, derecho_vulnerado, estado, is_active, responsable_uuid)
        VALUES ('TEST-ECCP-001', 'Accionante ECCP', $1, 'Pendiente', true, $2)
        ON CONFLICT (radicado) DO UPDATE SET responsable_uuid = EXCLUDED.responsable_uuid
        RETURNING id
      `, [CATEGORIA_ECCP, testUserUuid]);
      tutelaEccpId = rows[0].id;
    });

    afterAll(async () => {
      await pool.query('DELETE FROM impresiones_precedentes WHERE documento_id = $1', [docEccp]);
      await pool.query('DELETE FROM feedback_precedentes WHERE documento_id = $1', [docEccp]);
      await pool.query('DELETE FROM tutelas WHERE id = $1', [tutelaEccpId]);
      await pool.query('DELETE FROM base_conocimiento_enel WHERE documento_id = $1', [docEccp]);
    });

    describe('Doble escritura del voto', () => {
      test('votar útil crea un evento en feedback_precedentes', async () => {
        const res = await agent
          .post(`/api/tutelas/memoria/${docEccp}/feedback`)
          .send({ util: true, tutela_id: tutelaEccpId });
        expect(res.status).toBe(200);

        const { rows } = await pool.query(
          'SELECT util, categoria_contexto FROM feedback_precedentes WHERE usuario_uuid = $1 AND documento_id = $2 AND tutela_id = $3',
          [testUserUuid, docEccp, tutelaEccpId]
        );
        expect(rows).toHaveLength(1);
        expect(rows[0].util).toBe(true);
        expect(rows[0].categoria_contexto).toBe(CATEGORIA_ECCP);
      });

      test('re-votar el mismo caso/documento reemplaza el evento, no lo suma', async () => {
        const res = await agent
          .post(`/api/tutelas/memoria/${docEccp}/feedback`)
          .send({ util: false, tutela_id: tutelaEccpId });
        expect(res.status).toBe(200);

        const { rows } = await pool.query(
          'SELECT util FROM feedback_precedentes WHERE usuario_uuid = $1 AND documento_id = $2 AND tutela_id = $3',
          [testUserUuid, docEccp, tutelaEccpId]
        );
        expect(rows).toHaveLength(1);
        expect(rows[0].util).toBe(false);
      });

      test('votar sin tutela_id (frontend todavía no lo envía) sigue respondiendo 200', async () => {
        const res = await agent
          .post(`/api/tutelas/memoria/${docEccp}/feedback`)
          .send({ util: true });
        expect(res.status).toBe(200);
      });
    });

    // Nota: se ejercita `registrarImpresiones` directamente (no vía
    // GET /:id/sugerencias) porque el pipeline de embeddings locales
    // (@xenova/transformers) falla en este entorno de pruebas por un
    // problema de entorno preexistente y no relacionado con #165
    // ("A float32 tensor's data must be type of Float32Array" al correr
    // bajo Jest + --experimental-vm-modules en esta máquina) -- ningún otro
    // test de la suite llama hoy a un endpoint que genere un embedding real.
    // La función bajo prueba es la misma que usan los 4 endpoints reales
    // (tutelaController.js), solo se evita la generación de embeddings.
    describe('Instrumentación de impresiones', () => {
      const resultadosFicticios = [
        { documento_id: docEccp, score: 0.9 },
      ];

      test('registrarImpresiones inserta una fila por precedente, con contrafactual == mostrada', async () => {
        await registrarImpresiones({
          usuario_uuid: testUserUuid,
          tutela_id: tutelaEccpId,
          categoria_contexto: CATEGORIA_ECCP,
          resultados: resultadosFicticios,
        });

        const { rows } = await pool.query(
          `SELECT documento_id, posicion_mostrada, posicion_contrafactual, score_base, categoria_contexto
           FROM impresiones_precedentes WHERE tutela_id = $1 ORDER BY posicion_mostrada ASC`,
          [tutelaEccpId]
        );
        expect(rows).toHaveLength(resultadosFicticios.length);
        expect(rows[0].documento_id).toBe(docEccp);
        expect(rows[0].posicion_mostrada).toBe(1);
        expect(rows[0].posicion_contrafactual).toBe(1);
        expect(Number(rows[0].score_base)).toBeCloseTo(0.9);
        expect(rows[0].categoria_contexto).toBe(CATEGORIA_ECCP);
      });

      test('resultados vacíos no inserta nada y no lanza', async () => {
        await expect(registrarImpresiones({ usuario_uuid: testUserUuid, resultados: [] })).resolves.toBeUndefined();
      });

      test('un fallo de base de datos se loguea pero nunca lanza (no debe romper la búsqueda)', async () => {
        await expect(registrarImpresiones({
          usuario_uuid: testUserUuid,
          tutela_id: 'no-es-un-uuid-valido',
          resultados: resultadosFicticios,
        })).resolves.toBeUndefined();
      });
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
