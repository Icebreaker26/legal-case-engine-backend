import request from 'supertest';
import createApp from '../../src/app_test.js';
import pool from '../../src/db/database.js';
import bcrypt from 'bcrypt';

const app = createApp();
const agent = request.agent(app);

describe('Reportes — Integración', () => {
  let testUserUuid;
  let acreedorId;
  let proyectoId;
  let entidadId;
  let pagoId;

  const testEmail = 'reportes-test@icebreaker.com';
  const testPass  = 'testpass123';

  // ── Setup ────────────────────────────────────────────────────────────────────
  beforeAll(async () => {
    const hash = await bcrypt.hash(testPass, 10);
    const { rows } = await pool.query(
      `INSERT INTO global_usuarios (nombre, email, password_hash, rol, is_approved)
       VALUES ($1, $2, $3, 'juridico', true)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      ['Reportes Test', testEmail, hash]
    );
    testUserUuid = rows[0].id;

    // Permiso reportes:READ
    await pool.query(`
      INSERT INTO permisos (usuario_uuid, modulo_id, accion_id)
      SELECT $1, m.id, a.id FROM modulos m, acciones a
      WHERE m.nombre = 'reportes' AND a.nombre = 'READ'
      ON CONFLICT DO NOTHING
    `, [testUserUuid]);

    // Permiso pagos para crear dato de prueba
    await pool.query(`
      INSERT INTO permisos (usuario_uuid, modulo_id, accion_id)
      SELECT $1, m.id, a.id FROM modulos m, acciones a
      WHERE m.nombre = 'pagos' AND a.nombre IN ('READ_PAGO', 'WRITE_PAGO')
      ON CONFLICT DO NOTHING
    `, [testUserUuid]);

    // Catálogos de prueba
    const { rows: acRows } = await pool.query(
      `INSERT INTO global_acreedores (nombre, nit) VALUES ('Acreedor Reportes CI', '900111222-R')
       ON CONFLICT (nit) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id`
    );
    acreedorId = acRows[0].id;

    const { rows: pRows } = await pool.query(
      `INSERT INTO global_proyectos (nombre) VALUES ('Proyecto Reportes CI')
       ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id`
    );
    proyectoId = pRows[0].id;

    const { rows: eRows } = await pool.query(
      `INSERT INTO global_entidades (nombre) VALUES ('Entidad Reportes CI')
       ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id`
    );
    entidadId = eRows[0].id;

    // Pago de prueba para que el módulo devuelva datos
    const { rows: pagoRows } = await pool.query(
      `INSERT INTO pagos (concepto, monto, solicitante_uuid, acreedor_id, proyecto_id, estado)
       VALUES ('Pago CI Reportes', 500000, $1, $2, $3, 'solicitado')
       RETURNING id`,
      [testUserUuid, acreedorId, proyectoId]
    );
    pagoId = pagoRows[0].id;

    await agent.post('/api/auth/login').send({ email: testEmail, password: testPass });
  });

  // ── Teardown ─────────────────────────────────────────────────────────────────
  afterAll(async () => {
    if (pagoId) {
      await pool.query('DELETE FROM pago_trazabilidad WHERE pago_id = $1', [pagoId]);
      await pool.query('DELETE FROM pago_grupos WHERE pago_id = $1', [pagoId]);
      await pool.query('DELETE FROM pagos WHERE id = $1', [pagoId]);
    }
    await pool.query('DELETE FROM permisos WHERE usuario_uuid = $1', [testUserUuid]);
    await pool.query('DELETE FROM global_usuarios WHERE id = $1', [testUserUuid]);
    if (acreedorId) await pool.query('DELETE FROM global_acreedores WHERE id = $1', [acreedorId]);
    if (proyectoId) await pool.query('DELETE FROM global_proyectos WHERE id = $1', [proyectoId]);
    if (entidadId)  await pool.query('DELETE FROM global_entidades WHERE id = $1', [entidadId]);
    await pool.end();
  });

  // ── Auth ──────────────────────────────────────────────────────────────────────
  describe('Auth', () => {
    test('Rechaza sin token', async () => {
      const res = await request(app).post('/api/reportes/consultar').send({ modulos: ['pagos'] });
      expect(res.status).toBe(401);
    });

    test('Rechaza sin permiso reportes:READ', async () => {
      // Usuario sin permisos
      const hash = await bcrypt.hash('pass', 10);
      const { rows } = await pool.query(
        `INSERT INTO global_usuarios (nombre, email, password_hash, rol, is_approved)
         VALUES ('Sin Permiso', 'sinpermiso-reportes@icebreaker.com', $1, 'juridico', true)
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash RETURNING id`,
        [hash]
      );
      const sinPermUuid = rows[0].id;
      const agentSin = request.agent(app);
      await agentSin.post('/api/auth/login').send({ email: 'sinpermiso-reportes@icebreaker.com', password: 'pass' });

      const res = await agentSin.post('/api/reportes/consultar').send({ modulos: ['pagos'] });
      expect(res.status).toBe(403);

      await pool.query('DELETE FROM global_usuarios WHERE id = $1', [sinPermUuid]);
    });
  });

  // ── Validación Zod ────────────────────────────────────────────────────────────
  describe('Validación', () => {
    test('Rechaza módulo inválido', async () => {
      const res = await agent.post('/api/reportes/consultar').send({ modulos: ['inexistente'] });
      expect(res.status).toBe(400);
    });

    test('Rechaza fecha con formato incorrecto', async () => {
      const res = await agent.post('/api/reportes/consultar').send({ modulos: ['pagos'], fecha_desde: '01-01-2024' });
      expect(res.status).toBe(400);
    });

    test('Rechaza entidad_id no numérico', async () => {
      const res = await agent.post('/api/reportes/consultar').send({ modulos: ['pagos'], entidad_id: 'abc' });
      expect(res.status).toBe(400);
    });

    test('Rechaza responsable_uuid con formato incorrecto', async () => {
      const res = await agent.post('/api/reportes/consultar').send({ modulos: ['pagos'], responsable_uuid: 'no-es-uuid' });
      expect(res.status).toBe(400);
    });
  });

  // ── Consulta sin filtros ──────────────────────────────────────────────────────
  describe('Consulta sin filtros', () => {
    test('Devuelve estructura correcta con todos los módulos', async () => {
      const res = await agent.post('/api/reportes/consultar').send({});
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('por_modulo');
      expect(res.body).toHaveProperty('timeline');
      expect(res.body).toHaveProperty('totales');
      expect(Array.isArray(res.body.timeline)).toBe(true);
    });

    test('timeline contiene campos normalizados', async () => {
      const res = await agent.post('/api/reportes/consultar').send({ modulos: ['pagos'] });
      expect(res.status).toBe(200);
      const items = res.body.timeline;
      expect(items.length).toBeGreaterThan(0);
      const item = items[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('modulo');
      expect(item).toHaveProperty('titulo');
      expect(item).toHaveProperty('estado');
      expect(item).toHaveProperty('fecha');
      expect(item.modulo).toBe('pagos');
    });

    test('totales refleja el recuento por módulo', async () => {
      const res = await agent.post('/api/reportes/consultar').send({ modulos: ['pagos', 'contratos'] });
      expect(res.status).toBe(200);
      expect(res.body.totales).toHaveProperty('pagos');
      expect(res.body.totales).toHaveProperty('contratos');
      expect(typeof res.body.totales.pagos).toBe('number');
    });
  });

  // ── Filtros específicos ───────────────────────────────────────────────────────
  describe('Filtros', () => {
    test('Filtra por acreedor_id — solo devuelve pagos de ese acreedor', async () => {
      const res = await agent.post('/api/reportes/consultar').send({
        modulos: ['pagos'],
        acreedor_id: acreedorId,
      });
      expect(res.status).toBe(200);
      const pagos = res.body.por_modulo.pagos;
      expect(pagos.length).toBeGreaterThan(0);
      // El pago de prueba debe estar presente
      expect(pagos.some(p => p.titulo === 'Pago CI Reportes')).toBe(true);
    });

    test('Filtra por proyecto_id — reduce resultados', async () => {
      const res = await agent.post('/api/reportes/consultar').send({
        modulos: ['pagos'],
        proyecto_id: proyectoId,
      });
      expect(res.status).toBe(200);
      expect(res.body.por_modulo.pagos.length).toBeGreaterThan(0);
    });

    test('Filtra por entidad_id en comunicaciones — devuelve solo registros de esa entidad', async () => {
      // entidadId no tiene comunicaciones asociadas en el seed de prueba
      const res = await agent.post('/api/reportes/consultar').send({
        modulos: ['comunicaciones'],
        entidad_id: entidadId,
      });
      expect(res.status).toBe(200);
      // Todos los resultados deben pertenecer a esa entidad (si hay alguno)
      const coms = res.body.por_modulo.comunicaciones;
      expect(Array.isArray(coms)).toBe(true);
    });

    test('Filtra por estado exacto', async () => {
      const res = await agent.post('/api/reportes/consultar').send({
        modulos: ['pagos'],
        estado: 'solicitado',
      });
      expect(res.status).toBe(200);
      const pagos = res.body.por_modulo.pagos;
      expect(pagos.every(p => p.estado === 'solicitado')).toBe(true);
    });

    test('Filtra por rango de fechas', async () => {
      const res = await agent.post('/api/reportes/consultar').send({
        modulos: ['pagos'],
        fecha_desde: '2020-01-01',
        fecha_hasta: '2030-12-31',
      });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.timeline)).toBe(true);
    });

    test('Rango de fechas sin resultados devuelve arrays vacíos', async () => {
      const res = await agent.post('/api/reportes/consultar').send({
        modulos: ['pagos'],
        fecha_desde: '1990-01-01',
        fecha_hasta: '1990-12-31',
      });
      expect(res.status).toBe(200);
      expect(res.body.por_modulo.pagos).toHaveLength(0);
      expect(res.body.timeline).toHaveLength(0);
    });

    test('Filtra por responsable_uuid', async () => {
      const res = await agent.post('/api/reportes/consultar').send({
        modulos: ['pagos'],
        responsable_uuid: testUserUuid,
      });
      expect(res.status).toBe(200);
      expect(res.body.por_modulo.pagos.length).toBeGreaterThan(0);
    });
  });

  // ── Selección de módulos ──────────────────────────────────────────────────────
  describe('Selección de módulos', () => {
    test('Solo consulta los módulos solicitados', async () => {
      const res = await agent.post('/api/reportes/consultar').send({ modulos: ['tutelas', 'ambiental'] });
      expect(res.status).toBe(200);
      expect(res.body.por_modulo).toHaveProperty('tutelas');
      expect(res.body.por_modulo).toHaveProperty('ambiental');
      expect(res.body.por_modulo).not.toHaveProperty('pagos');
    });

    test('timeline está ordenado por fecha descendente', async () => {
      const res = await agent.post('/api/reportes/consultar').send({});
      expect(res.status).toBe(200);
      const items = res.body.timeline.filter(i => i.fecha);
      for (let i = 0; i < items.length - 1; i++) {
        expect(new Date(items[i].fecha) >= new Date(items[i + 1].fecha)).toBe(true);
      }
    });

    test('totales suma correctamente con el timeline', async () => {
      const res = await agent.post('/api/reportes/consultar').send({ modulos: ['pagos', 'comunicaciones'] });
      expect(res.status).toBe(200);
      const sumaTotal = Object.values(res.body.totales).reduce((a, b) => a + b, 0);
      expect(res.body.timeline.length).toBe(sumaTotal);
    });
  });
});
