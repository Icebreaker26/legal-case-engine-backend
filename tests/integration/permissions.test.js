import request from 'supertest';
import { default as createApp } from '../../src/app_test.js';
import pool from '../../src/db/database.js';

const app = createApp();
const agent = request.agent(app);

describe('Sistema de Permisos - Integración', () => {
    const userId = 1;

    let authToken;

    // Autenticar una vez antes de todas las pruebas y reutilizar la cookie
    beforeAll(async () => {
        await pool.query('DELETE FROM permisos WHERE usuario_id = $1', [userId]);
        
        const loginRes = await agent.post('/api/auth/login').send({
            email: 'alejandro.marin@enel.com',
            password: '123456'
        });
        
        expect(loginRes.status).toBe(200);
        // Asumiendo que el login devuelve el token en la cookie, pero para asegurar, usaremos el header si es necesario.
        // Supertest agent maneja cookies automáticamente si se usan cookies. 
        // Vamos a verificar si loginRes tiene la cookie.
    });

    test('POST /api/tutelas/procesar debería bloquear acceso sin permiso WRITE', async () => {
        // Asegurarse de que no tenemos permiso WRITE
        await pool.query('DELETE FROM permisos WHERE usuario_id = $1 AND accion_id = (SELECT id FROM acciones WHERE nombre = \'WRITE\')', [userId]);
        
        const res = await agent.post('/api/tutelas/procesar');
        // Esperamos 403 por falta de permisos (o 400 si el middleware de autorización pasa pero falta el archivo)
        expect(res.status).toBe(403);
    });

    test('POST /api/tutelas/procesar debería permitir acceso con permiso WRITE', async () => {
        // Asignar permiso WRITE
        await pool.query(`
            INSERT INTO permisos (usuario_id, modulo_id, accion_id)
            SELECT $1, m.id, a.id
            FROM modulos m, acciones a
            WHERE m.nombre = 'tutelas' AND a.nombre = 'WRITE'
            ON CONFLICT DO NOTHING;
        `, [userId]);

        const res = await agent.post('/api/tutelas/procesar');
        // Debería pasar la autorización, y fallar por falta de archivo (400)
        expect(res.status).not.toBe(403);
    });
});
