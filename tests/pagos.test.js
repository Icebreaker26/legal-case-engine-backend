import { 
    crearPago, 
    listarPagos, 
    actualizarEstadoPago, 
    obtenerTrazabilidad 
} from '../src/modules/pagos/controllers/pagosController.js';
import pool from '../src/db/database.js';

const mockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.body = data; return res; };
    return res;
};

describe('Módulo Pagos - CRUD e Integración', () => {
    let pagoId;
    let testUserUuid;
    let testAcreedorId;

    beforeAll(async () => {
        const userRes = await pool.query('SELECT id FROM global_usuarios LIMIT 1');
        testUserUuid = userRes.rows[0].id;

        const acreedorRes = await pool.query(
            'INSERT INTO global_acreedores (nombre, nit) VALUES ($1, $2) RETURNING id',
            ['Acreedor Test', '900123456']
        );
        testAcreedorId = acreedorRes.rows[0].id;
    });

    test('Debería crear un pago', async () => {
        const res = mockRes();
        await crearPago({ 
            body: { 
                concepto: 'Concepto prueba', 
                monto: 100000, 
                acreedor_id: testAcreedorId,
                fecha_solicitud: '2026-06-03',
                soportes_link: 'http://test.com'
            },
            user: { id: testUserUuid } // Usar UUID
        }, res);
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('id');
        pagoId = res.body.id;
    });
    // ...

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
            user: { id: testUserUuid } 
        }, res);
        expect(res.body.message).toBe('Estado de pago actualizado.');
    });

    test('Debería listar trazabilidad', async () => {
        const res = mockRes();
        await obtenerTrazabilidad({ params: { id: pagoId } }, res);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });

    afterAll(async () => {
        if (pagoId) {
            await pool.query('DELETE FROM pago_trazabilidad WHERE pago_id = $1', [pagoId]);
            await pool.query('DELETE FROM pagos WHERE id = $1', [pagoId]);
        }
        if (testAcreedorId) {
            await pool.query('DELETE FROM global_acreedores WHERE id = $1', [testAcreedorId]);
        }
        await pool.end();
    });
});
