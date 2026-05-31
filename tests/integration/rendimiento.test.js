import request from 'supertest';
import { default as createApp } from '../../src/app_test.js';
import pool from '../../src/db/database.js';
import bcrypt from 'bcrypt';

const app = createApp();
const agent = request.agent(app);

describe('Módulo de Rendimiento - Integración', () => {
    let testUserId;
    let testObjetivoId;
    const testEmail = 'rend-test@icebreaker.com';
    const testPass = 'testpass123';

    beforeAll(async () => {
        // 1. Crear usuario de prueba dedicado (Idempotente)
        const hash = await bcrypt.hash(testPass, 10);
        const userRes = await pool.query(
            'INSERT INTO abogados (nombre, email, password_hash, especialidad, is_approved) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash RETURNING id',
            ['Rendimiento Test User', testEmail, hash, 'Testing', true]
        );
        testUserId = userRes.rows[0].id;

        // 2. Autenticar
        await agent.post('/api/auth/login').send({
            email: testEmail,
            password: testPass
        });

        // 3. Asegurar que el módulo 'rendimiento' existe y conceder permisos al usuario de prueba
        await pool.query("INSERT INTO modulos (nombre) VALUES ('rendimiento') ON CONFLICT (nombre) DO NOTHING");
        
        await pool.query(`
            INSERT INTO permisos (usuario_id, modulo_id, accion_id)
            SELECT $1, m.id, a.id
            FROM modulos m, acciones a
            WHERE m.nombre = 'rendimiento' AND a.nombre IN ('READ', 'WRITE', 'DELETE', 'MANAGE_TEAMS')
            ON CONFLICT DO NOTHING;
        `, [testUserId]);

        // 4. Crear objetivo de prueba con el esquema real (mes, anio, titulo)
        const objRes = await pool.query(
            'INSERT INTO objetivos (usuario_id, meta_acciones, mes, anio, titulo, descripcion, estado) VALUES ($1, 10, 5, 2026, \'Objetivo Test\', \'Descripción de prueba\', \'active\') RETURNING id',
            [testUserId]
        );
        testObjetivoId = objRes.rows[0].id;
    });

    afterAll(async () => {
        // Limpieza quirúrgica de datos de prueba
        if (testUserId) {
            await pool.query('DELETE FROM logs_sistema WHERE usuario_id = $1', [testUserId]);
            await pool.query('DELETE FROM registro_acciones WHERE usuario_id = $1', [testUserId]);
            await pool.query('DELETE FROM objetivos WHERE usuario_id = $1', [testUserId]);
            await pool.query('DELETE FROM permisos WHERE usuario_id = $1', [testUserId]);
            await pool.query('DELETE FROM abogados WHERE id = $1', [testUserId]);
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

    test('GET /api/rendimiento/cumplimiento/individual/:usuario_id debería calcular porcentaje', async () => {
        const res = await agent.get(`/api/rendimiento/cumplimiento/individual/${testUserId}`);
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
