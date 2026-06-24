import request from 'supertest';
import { default as createApp } from '../../src/app_test.js';
import pool from '../../src/db/database.js';
import bcrypt from 'bcrypt';

const app = createApp();
const agent = request.agent(app);

describe('Sistema de Permisos - Integración', () => {
    let testUserUuid;
    const testEmail = 'perm-test@icebreaker.com';
    const testPass = 'testpass123';

    let adminUserUuid;
    const adminEmail = 'perm-admin@icebreaker.com';
    const adminAgent = request.agent(app);

    beforeAll(async () => {
        const hash = await bcrypt.hash(testPass, 10);

        // Usuario sin permisos de admin
        const userRes = await pool.query(
            `INSERT INTO global_usuarios (nombre, email, password_hash, rol, is_approved)
             VALUES ($1, $2, $3, 'juridico', true)
             ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash RETURNING id`,
            ['Perm Test User', testEmail, hash]
        );
        testUserUuid = userRes.rows[0].id;

        // Usuario con permiso admin:READ, WRITE, DELETE
        const adminRes = await pool.query(
            `INSERT INTO global_usuarios (nombre, email, password_hash, rol, is_approved)
             VALUES ($1, $2, $3, 'admin', true)
             ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash RETURNING id`,
            ['Perm Admin User', adminEmail, hash]
        );
        adminUserUuid = adminRes.rows[0].id;

        await pool.query(`
            INSERT INTO permisos (usuario_uuid, modulo_id, accion_id)
            SELECT $1, m.id, a.id FROM modulos m, acciones a
            WHERE m.nombre = 'admin' AND a.nombre IN ('READ', 'WRITE', 'DELETE')
            ON CONFLICT DO NOTHING
        `, [adminUserUuid]);

        await agent.post('/api/auth/login').send({ email: testEmail, password: testPass });
        await adminAgent.post('/api/auth/login').send({ email: adminEmail, password: testPass });
    });

    afterAll(async () => {
        for (const uuid of [testUserUuid, adminUserUuid]) {
            if (uuid) {
                await pool.query('DELETE FROM logs_sistema WHERE usuario_uuid = $1', [uuid]);
                await pool.query('DELETE FROM permisos WHERE usuario_uuid = $1', [uuid]);
                await pool.query('DELETE FROM global_usuarios WHERE id = $1', [uuid]);
            }
        }
        await pool.end();
    });

    // ── checkPermission en rutas de tutelas ────────────────────────────────────

    test('POST /api/tutelas/procesar — bloquea sin permiso WRITE', async () => {
        const res = await agent.post('/api/tutelas/procesar');
        expect(res.status).toBe(403);
    });

    test('POST /api/tutelas/procesar — permite con permiso tutelas:WRITE', async () => {
        await pool.query(`
            INSERT INTO permisos (usuario_uuid, modulo_id, accion_id)
            SELECT $1, m.id, a.id FROM modulos m, acciones a
            WHERE m.nombre = 'tutelas' AND a.nombre = 'WRITE'
            ON CONFLICT DO NOTHING
        `, [testUserUuid]);

        const res = await agent.post('/api/tutelas/procesar');
        expect(res.status).not.toBe(403);
        expect(res.status).not.toBe(401);
    });

    // ── Rutas /api/permisos requieren admin:READ/WRITE/DELETE ─────────────────

    test('GET /api/permisos/usuario/:uuid — rechaza sin token', async () => {
        const res = await request(app).get(`/api/permisos/usuario/${testUserUuid}`);
        expect(res.status).toBe(401);
    });

    test('GET /api/permisos/usuario/:uuid — bloquea sin permiso admin', async () => {
        const res = await agent.get(`/api/permisos/usuario/${testUserUuid}`);
        expect(res.status).toBe(403);
    });

    test('GET /api/permisos/usuario/:uuid — permite con permiso admin:READ', async () => {
        const res = await adminAgent.get(`/api/permisos/usuario/${adminUserUuid}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('POST /api/permisos/asignar — bloquea sin permiso admin', async () => {
        const res = await agent.post('/api/permisos/asignar').send({
            usuario_uuid: testUserUuid,
            modulo: 'tutelas',
            accion: 'READ',
        });
        expect(res.status).toBe(403);
    });

    test('POST /api/permisos/asignar — permite con permiso admin:WRITE', async () => {
        const res = await adminAgent.post('/api/permisos/asignar').send({
            usuario_uuid: testUserUuid,
            modulo: 'tutelas',
            accion: 'READ',
        });
        // 200 OK o 409 si ya existe — nunca 403/401
        expect(res.status).not.toBe(403);
        expect(res.status).not.toBe(401);
    });

    test('DELETE /api/permisos/revocar — bloquea sin permiso admin', async () => {
        const res = await agent.delete('/api/permisos/revocar').send({
            usuario_uuid: testUserUuid,
            modulo: 'tutelas',
            accion: 'READ',
        });
        expect(res.status).toBe(403);
    });

    test('DELETE /api/permisos/revocar — permite con permiso admin:DELETE', async () => {
        const res = await adminAgent.delete('/api/permisos/revocar').send({
            usuario_uuid: testUserUuid,
            modulo: 'tutelas',
            accion: 'READ',
        });
        expect(res.status).not.toBe(403);
        expect(res.status).not.toBe(401);
    });

    // ── /api/core/usuarios-activos requiere admin:READ ─────────────────────────

    test('GET /api/core/usuarios-activos — bloquea sin permiso admin', async () => {
        const res = await agent.get('/api/core/usuarios-activos');
        expect(res.status).toBe(403);
    });

    test('GET /api/core/usuarios-activos — permite con permiso admin:READ', async () => {
        const res = await adminAgent.get('/api/core/usuarios-activos');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});
