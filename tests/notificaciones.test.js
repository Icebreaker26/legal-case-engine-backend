import { 
    listarNotificaciones, 
    marcarComoLeida 
} from '../src/modules/notificaciones/controllers/notificacionesController.js';
import { crearNotificacion } from '../src/modules/notificaciones/services/notificationService.js';
import pool from '../src/db/database.js';

const mockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.body = data; return res; };
    return res;
};

describe('Módulo Notificaciones - Integración', () => {
    let notificacionId;
    const userId = 1;

    test('Debería crear una notificación vía servicio', async () => {
        await crearNotificacion(userId, 'Test notificación', 'test', 1);
        const { rows } = await pool.query('SELECT id FROM notificaciones WHERE usuario_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]);
        expect(rows.length).toBe(1);
        notificacionId = rows[0].id;
    });

    test('Debería listar notificaciones del usuario', async () => {
        const res = mockRes();
        await listarNotificaciones({ user: { id: userId } }, res);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });

    test('Debería marcar notificación como leída', async () => {
        const res = mockRes();
        await marcarComoLeida({ 
            params: { id: notificacionId }, 
            user: { id: userId } 
        }, res);
        expect(res.statusCode).toBe(200);
        
        const { rows } = await pool.query('SELECT leida FROM notificaciones WHERE id = $1', [notificacionId]);
        expect(rows[0].leida).toBe(true);
    });
});
