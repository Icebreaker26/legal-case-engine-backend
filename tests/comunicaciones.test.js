import { 
    crearComunicacion, 
    listarComunicaciones, 
    eliminarComunicacion,
    agregarComentario,
    listarComentarios
} from '../src/modules/comunicaciones/controllers/comunicacionesController.js';
import pool from '../src/db/database.js';

const mockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.body = data; return res; };
    return res;
};

describe('Módulo Comunicaciones - CRUD e Integración', () => {
    let comunicacionId;
    let testUserUuid;

    beforeAll(async () => {
        const userRes = await pool.query('SELECT id FROM global_usuarios LIMIT 1');
        testUserUuid = userRes.rows[0].id;
    });

    test('Debería crear una comunicación', async () => {
        const res = mockRes();
        await crearComunicacion({ 
            body: { 
                entidad_id: 1, 
                tipo: 'recibida', 
                asunto: 'Asunto prueba', 
                fecha_recepcion: '2026-06-01', 
                fecha_limite: '2026-06-30', 
                responsable_uuid: testUserUuid 
            },
            user: { id: testUserUuid }
        }, res);
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('id');
        comunicacionId = res.body.id;
    });

    test('Debería listar comunicaciones activas', async () => {
        const res = mockRes();
        await listarComunicaciones({}, res);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });

    test('Debería agregar un comentario', async () => {
        const res = mockRes();
        await agregarComentario({ 
            params: { id: comunicacionId }, 
            body: { comentario: 'Comentario prueba' }, 
            user: { id: testUserUuid } 
        }, res);
        expect(res.statusCode).toBe(201);
    });

    test('Debería listar comentarios', async () => {
        const res = mockRes();
        await listarComentarios({ params: { id: comunicacionId } }, res);
        expect(res.body.length).toBeGreaterThan(0);
    });

    test('Debería realizar borrado lógico', async () => {
        const res = mockRes();
        await eliminarComunicacion({ params: { id: comunicacionId } }, res);
        
        const resList = mockRes();
        await listarComunicaciones({}, resList);
        
        const com = resList.body.find(c => c.id === comunicacionId);
        expect(com).toBeDefined();
        expect(com.is_active).toBe(false);
    });
});
