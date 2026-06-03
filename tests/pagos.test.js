import { 
    crearPago, 
    listarPagos, 
    actualizarEstadoPago, 
    obtenerTrazabilidad 
} from '../src/modules/pagos/controllers/pagosController.js';

const mockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.body = data; return res; };
    return res;
};

describe('Módulo Pagos - CRUD e Integración', () => {
    let pagoId;

    test('Debería crear un pago', async () => {
        const res = mockRes();
        await crearPago({ 
            body: { 
                concepto: 'Concepto prueba', 
                monto: 100000, 
                nit: '123456789',
                solicitante_id: 1, 
                fecha_solicitud: '2026-06-03',
                soportes_link: 'http://test.com'
            },
            user: { id: 1 }
        }, res);
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('id');
        pagoId = res.body.id;
    });

    test('Debería listar pagos', async () => {
        const res = mockRes();
        await listarPagos({}, res);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });

    test('Debería actualizar estado y crear trazabilidad', async () => {
        const res = mockRes();
        await actualizarEstadoPago({ 
            params: { id: pagoId }, 
            body: { estado: 'liberado', comentario: 'Prueba cambio estado' },
            user: { id: 1 } 
        }, res);
        expect(res.body.message).toBe('Estado de pago actualizado.');
    });

    test('Debería listar trazabilidad', async () => {
        const res = mockRes();
        await obtenerTrazabilidad({ params: { id: pagoId } }, res);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });
});
