import request from 'supertest';
import { default as createApp } from '../../src/app_test.js';
import pool from '../../src/db/database.js';
import bcrypt from 'bcrypt';

const app = createApp();
const agent = request.agent(app);

describe('Módulo de Rendimiento - Integración', () => {
    let testUserUuid; // Cambiado a UUID
    let testObjetivoId;
    const testEmail = 'rend-test@icebreaker.com';
    const testPass = 'testpass123';

    beforeAll(async () => {
        // 1. Crear usuario de prueba dedicado en global_usuarios (Idempotente)
        const hash = await bcrypt.hash(testPass, 10);
        const userRes = await pool.query(
            'INSERT INTO global_usuarios (nombre, email, password_hash, rol, is_approved) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash RETURNING id',
            ['Rendimiento Test User', testEmail, hash, 'juridico', true]
        );
        testUserUuid = userRes.rows[0].id; // Esto es ahora un UUID

        // 2. Autenticar (Asumiendo que el login usa global_usuarios)
        await agent.post('/api/auth/login').send({
            email: testEmail,
            password: testPass
        });

        // 3. Conceder permisos (Actualizado para usar UUID)
        await pool.query("INSERT INTO modulos (nombre) VALUES ('rendimiento') ON CONFLICT (nombre) DO NOTHING");
        
        await pool.query(`
            INSERT INTO permisos (usuario_uuid, modulo_id, accion_id)
            SELECT $1, m.id, a.id
            FROM modulos m, acciones a
            WHERE m.nombre = 'rendimiento' AND a.nombre IN ('READ', 'WRITE', 'DELETE', 'MANAGE_TEAMS')
            ON CONFLICT DO NOTHING;
        `, [testUserUuid]);

        // 4. Crear objetivo de prueba
        const objRes = await pool.query(
            'INSERT INTO objetivos (usuario_uuid, meta_acciones, mes, anio, titulo, descripcion, estado) VALUES ($1, 10, 5, 2026, \'Objetivo Test\', \'Descripción de prueba\', \'active\') RETURNING id',
            [testUserUuid]
        );
        testObjetivoId = objRes.rows[0].id;
    });

    afterAll(async () => {
        if (testUserUuid) {
            await pool.query('DELETE FROM registro_acciones WHERE usuario_uuid = $1', [testUserUuid]);
            await pool.query('DELETE FROM objetivos WHERE usuario_uuid = $1', [testUserUuid]);
            await pool.query('DELETE FROM comunicaciones WHERE responsable_uuid = $1', [testUserUuid]);
            await pool.query('DELETE FROM conformidad_trazabilidad WHERE conformidad_id IN (SELECT id FROM conformidades WHERE responsable_uuid = $1 OR solicitante_uuid = $1)', [testUserUuid]);
            await pool.query('DELETE FROM conformidad_grupos WHERE conformidad_id IN (SELECT id FROM conformidades WHERE responsable_uuid = $1 OR solicitante_uuid = $1)', [testUserUuid]);
            await pool.query('DELETE FROM conformidades WHERE responsable_uuid = $1 OR solicitante_uuid = $1', [testUserUuid]);
            await pool.query('DELETE FROM logs_sistema WHERE usuario_uuid = $1', [testUserUuid]);
            await pool.query('DELETE FROM permisos WHERE usuario_uuid = $1', [testUserUuid]);
            await pool.query('DELETE FROM global_usuarios WHERE id = $1', [testUserUuid]);
        }
        await pool.end();
    });

    test('POST /api/rendimiento/acciones debería registrar acción correctamente', async () => {
        const res = await agent.post('/api/rendimiento/acciones').send({
            objetivo_id: testObjetivoId,
            comentario: 'Prueba de registro de acción',
            peso: 2
        });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
    });

    test('GET /api/rendimiento/cumplimiento/individual/:usuario_uuid debería calcular porcentaje', async () => {
        const res = await agent.get(`/api/rendimiento/cumplimiento/individual/${testUserUuid}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        
        const objetivo = res.body.find(o => o.id === testObjetivoId);
        expect(objetivo).toBeDefined();
        expect(Number(objetivo.porcentaje_cumplimiento)).toBe(20);
    });

    test('PATCH /api/rendimiento/objetivos/:id/archivar debería cambiar estado a archived', async () => {
        const res = await agent.patch(`/api/rendimiento/objetivos/${testObjetivoId}/archivar`);
        expect(res.status).toBe(200);
        
        const check = await pool.query('SELECT estado FROM objetivos WHERE id = $1', [testObjetivoId]);
        expect(check.rows[0].estado).toBe('archived');
    });

    test('GET /api/rendimiento/objetivos/:id/acciones debería retornar historial', async () => {
        const res = await agent.get(`/api/rendimiento/objetivos/${testObjetivoId}/acciones`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0].comentario).toBe('Prueba de registro de acción');
    });
});
