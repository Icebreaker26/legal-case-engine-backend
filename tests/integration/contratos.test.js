import request from 'supertest';
import createApp from '../../src/app_test.js';
import pool from '../../src/db/database.js';
import bcrypt from 'bcrypt';

const app = createApp();
const agent = request.agent(app);

describe('Módulo Contratos - Pruebas de Integración', () => {
    let testUserUuid;
    const testEmail = 'contratos-test@icebreaker.com';
    const testPass = 'testpass123';

    beforeAll(async () => {
        const hash = await bcrypt.hash(testPass, 10);
        const userRes = await pool.query(
            'INSERT INTO global_usuarios (nombre, email, password_hash, rol, is_approved) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash RETURNING id',
            ['Contratos Test User', testEmail, hash, 'juridico', true]
        );
        testUserUuid = userRes.rows[0].id;

        // Obtener el ID del módulo dinámicamente (evita hardcodear IDs que varían por entorno)
        const moduloRes = await pool.query(
            `INSERT INTO modulos (nombre) VALUES ('contratos') ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id`
        );
        const moduloId = moduloRes.rows[0].id;

        // Conceder permisos READ/WRITE
        await pool.query(`
            INSERT INTO permisos (usuario_uuid, modulo_id, accion_id)
            SELECT $1, $2, id FROM acciones WHERE nombre IN ('READ', 'WRITE')
            ON CONFLICT DO NOTHING;
        `, [testUserUuid, moduloId]);

        // Login
        await agent.post('/api/auth/login').send({ email: testEmail, password: testPass });
    });

    afterAll(async () => {
        await pool.query('DELETE FROM registros_auditoria WHERE creado_por = $1', [testUserUuid]);
        await pool.query('DELETE FROM permisos WHERE usuario_uuid = $1', [testUserUuid]);
        await pool.query('DELETE FROM global_usuarios WHERE id = $1', [testUserUuid]);
        await pool.end();
    });

    describe('GET /api/contratos/minutas', () => {
        it('debe listar minutas', async () => {
            const response = await agent.get('/api/contratos/minutas');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('POST /api/contratos/auditorias/comparar', () => {
        it('debe permitir comparar contrato', async () => {
            const minuta = await pool.query('INSERT INTO minutas_estandar (titulo, contenido_texto) VALUES ($1, $2) RETURNING id', ['Minuta Prueba', 'Contenido Original']);
            
            const response = await agent
                .post('/api/contratos/auditorias/comparar')
                .field('minutaEstandarId', minuta.rows[0].id)
                .attach('file', Buffer.from('Contenido Modificado'), 'contrato.txt');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('prompt');
        });
    });
});
