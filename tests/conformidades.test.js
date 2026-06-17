import { 
    crearConformidad, 
    listarConformidades, 
    actualizarEstadoConformidad, 
    obtenerTrazabilidad 
} from '../src/modules/conformidades/controllers/conformidadesController.js';

const mockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.body = data; return res; };
    return res;
};

const TEST_USER_UUID = '787b8bcf-9555-451e-87de-97dca52bc5a7';

describe('Módulo Conformidades - CRUD e Integración', () => {
    let conformidadId;

    test('Debería crear una conformidad', async () => {
        const res = mockRes();
        await crearConformidad({ 
            body: { 
                concepto: 'Concepto prueba', 
                entidad_id: 1,
                proyecto_id: 1,
                contrato_id: 1,
                responsable_uuid: TEST_USER_UUID,
                solicitante_uuid: TEST_USER_UUID, 
                fecha_recepcion: '2026-06-11',
                fecha_solicitud: '2026-06-11',
                ot: 'OT123',
                wbe: 'WBE456',
                valor: 500000,
                link_acta: 'http://acta.com',
                soportes_link: 'http://test.com'
            },
            user: { id: TEST_USER_UUID }
        }, res);
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('id');
        conformidadId = res.body.id;
    });

    test('Debería listar conformidades', async () => {
        const res = mockRes();
        await listarConformidades({}, res);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });

    test('Debería actualizar estado y crear trazabilidad', async () => {
        const res = mockRes();
        await actualizarEstadoConformidad({ 
            params: { id: conformidadId }, 
            body: { 
                estado: 'CONFORMADO', 
                comentario: 'Prueba cambio estado',
                hoja_contable_normal: 'HCN123',
                hoja_contable_reembolsable: 'HCR456',
                numero_conformidad: 'CONF001'
            },
            user: { id: TEST_USER_UUID } 
        }, res);
        expect(res.body.message).toBe('Estado actualizado.');
    });

    test('Debería listar trazabilidad', async () => {
        const res = mockRes();
        await obtenerTrazabilidad({ params: { id: conformidadId } }, res);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });
});
