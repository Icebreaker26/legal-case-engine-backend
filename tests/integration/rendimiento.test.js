import request from 'supertest';
import { default as createApp } from '../../src/app_test.js';
import pool from '../../src/db/database.js';

const app = createApp();
const agent = request.agent(app);

describe('Módulo de Rendimiento - Integración', () => {
    const userId = 1;
    let testObjetivoId;

    beforeAll(async () => {
        // 1. Autenticar
        await agent.post('/api/auth/login').send({
            email: 'alejandro.marin@enel.com',
            password: '123456'
        });

        // 2. Conceder permisos necesarios para el módulo de rendimiento
        await pool.query(`
            INSERT INTO permisos (usuario_id, modulo_id, accion_id)
            SELECT $1, m.id, a.id
            FROM modulos m, acciones a
            WHERE m.nombre = 'rendimiento' AND a.nombre IN ('READ', 'WRITE', 'DELETE', 'MANAGE_TEAMS')
            ON CONFLICT DO NOTHING;
        `, [userId]);

        // Asegurar que el módulo 'rendimiento' existe
        await pool.query("INSERT INTO modulos (nombre) VALUES ('rendimiento') ON CONFLICT DO NOTHING");
        
        // Reintentar inserción de permisos una vez asegurado el módulo
        await pool.query(`
            INSERT INTO permisos (usuario_id, modulo_id, accion_id)
            SELECT $1, m.id, a.id
            FROM modulos m, acciones a
            WHERE m.nombre = 'rendimiento' AND a.nombre IN ('READ', 'WRITE', 'DELETE', 'MANAGE_TEAMS')
            ON CONFLICT DO NOTHING;
        `, [userId]);

        // 3. Crear objetivo de prueba
        const objRes = await pool.query(
            'INSERT INTO objetivos (usuario_id, meta_acciones, periodo_inicio, periodo_fin) VALUES ($1, 10, \'2026-05-01\', \'2026-05-31\') RETURNING id',
            [userId]
        );
        testObjetivoId = objRes.rows[0].id;
    });

    afterAll(async () => {
        await pool.query('DELETE FROM permisos WHERE usuario_id = $1', [userId]);
        await pool.query('DELETE FROM objetivos WHERE usuario_id = $1', [userId]);
    });

    test('POST /api/rendimiento/acciones debería registrar acción con peso', async () => {
        const res = await agent.post('/api/rendimiento/acciones').send({
            objetivo_id: testObjetivoId,
            comentario: 'Test acción',
            peso: 2
        });
        expect(res.status).toBe(201);
    });

    test('GET /api/rendimiento/cumplimiento/individual/:usuario_id debería calcular cumplimiento', async () => {
        const res = await agent.get(`/api/rendimiento/cumplimiento/individual/${userId}`);
        expect(res.status).toBe(200);
        expect(res.body[0].porcentaje_cumplimiento).toBeGreaterThan(0);
    });

    test('PATCH /api/rendimiento/objetivos/:id/archivar debería archivar objetivo', async () => {
        const res = await agent.patch(`/api/rendimiento/objetivos/${testObjetivoId}/archivar`);
        expect(res.status).toBe(200);
        
        const check = await pool.query('SELECT estado FROM objetivos WHERE id = $1', [testObjetivoId]);
        expect(check.rows[0].estado).toBe('archived');
    });
});
