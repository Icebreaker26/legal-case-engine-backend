import { 
    crearComunicacion, 
    listarComunicaciones, 
    eliminarComunicacion,
    agregarComentario,
    listarComentarios
} from '../src/modules/comunicaciones/controllers/comunicacionesController.js';

const mockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.body = data; return res; };
    return res;
};

describe('Módulo Comunicaciones - CRUD e Integración', () => {
    let comunicacionId;

    test('Debería crear una comunicación', async () => {
        const res = mockRes();
        await crearComunicacion({ 
            body: { 
                entidad: 'CAR', 
                tipo: 'recibida', 
                asunto: 'Asunto prueba', 
                fecha_recepcion: '2026-06-01', 
                fecha_limite: '2026-06-30', 
                responsable_id: 1 
            } 
        }, res);
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('id');
        comunicacionId = res.body.id;
    });

    test('Debería listar comunicaciones activas', async () => {
        const res = mockRes();
        await listarComunicaciones({}, res);
        // Controlador usa res.json() directamente, sin status() explícito (asume 200)
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });

    test('Debería agregar un comentario', async () => {
        const res = mockRes();
        await agregarComentario({ 
            params: { id: comunicacionId }, 
            body: { comentario: 'Comentario prueba' }, 
            user: { id: 1 } 
        }, res);
        expect(res.statusCode).toBe(201);
    });

    test('Debería listar comentarios', async () => {
        const res = mockRes();
        await listarComentarios({ params: { id: comunicacionId } }, res);
        // Controlador usa res.json() directamente
        expect(res.body.length).toBe(1);
    });

    test('Debería realizar borrado lógico', async () => {
        const res = mockRes();
        await eliminarComunicacion({ params: { id: comunicacionId } }, res);
        
        const resList = mockRes();
        await listarComunicaciones({}, resList);
        
        // Verificamos que la comunicación aún existe pero está marcada como inactiva
        const com = resList.body.find(c => c.id === comunicacionId);
        expect(com).toBeDefined();
        expect(com.is_active).toBe(false);
    });
});
