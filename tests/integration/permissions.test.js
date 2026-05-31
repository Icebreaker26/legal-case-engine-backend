import request from 'supertest';
import { default as createApp } from '../../src/app_test.js';
import pool from '../../src/db/database.js';
import bcrypt from 'bcrypt';

const app = createApp();
const agent = request.agent(app);

describe('Sistema de Permisos - Integración', () => {
    let testUserId;
    const testEmail = 'perm-test@icebreaker.com';
    const testPass = 'testpass123';

    // Crear un usuario dedicado para no afectar al usuario real (Idempotente)
    beforeAll(async () => {
        const hash = await bcrypt.hash(testPass, 10);
        const userRes = await pool.query(
            'INSERT INTO abogados (nombre, email, password_hash, especialidad, is_approved) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash RETURNING id',
            ['Perm Test User', testEmail, hash, 'Testing', true]
        );
        testUserId = userRes.rows[0].id;

        const loginRes = await agent.post('/api/auth/login').send({
            email: testEmail,
            password: testPass
        });
        
        expect(loginRes.status).toBe(200);
    });

    afterAll(async () => {
        if (testUserId) {
            await pool.query('DELETE FROM logs_sistema WHERE usuario_id = $1', [testUserId]);
            await pool.query('DELETE FROM permisos WHERE usuario_id = $1', [testUserId]);
            await pool.query('DELETE FROM abogados WHERE id = $1', [testUserId]);
        }
        await pool.end();
    });

    test('POST /api/tutelas/procesar debería bloquear acceso sin permiso WRITE', async () => {
        const res = await agent.post('/api/tutelas/procesar');
        // El middleware de permisos debería retornar 403
        expect(res.status).toBe(403);
    });

    test('POST /api/tutelas/procesar debería permitir acceso con permiso WRITE', async () => {
        // Asignar permiso WRITE al usuario de prueba
        await pool.query(`
            INSERT INTO permisos (usuario_id, modulo_id, accion_id)
            SELECT $1, m.id, a.id
            FROM modulos m, acciones a
            WHERE m.nombre = 'tutelas' AND a.nombre = 'WRITE'
            ON CONFLICT DO NOTHING;
        `, [testUserId]);

        const res = await agent.post('/api/tutelas/procesar');
        // Debería pasar la autorización, y fallar por falta de archivo (400) o dar otro error no relacionado con permisos
        expect(res.status).not.toBe(403);
        expect(res.status).not.toBe(401);
    });
});
