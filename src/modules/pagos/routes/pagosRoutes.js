import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/authMiddleware.js';
import { checkPermission } from '../../../middlewares/permissionMiddleware.js';
import { validate } from '../../../middlewares/validateMiddleware.js';
import { 
    crearPago, 
    listarPagos, 
    listarMisPagos,
    actualizarEstadoPago, 
    obtenerTrazabilidad,
    obtenerEstadisticas,
    listarEstados,
    listarEstadosInactivos,
    recuperarEstado,
    listarGrupos,
    asignarGrupoAPago,
    eliminarGrupoDePago
} from '../controllers/pagosController.js';
import { pagoSchema, pagoTrazabilidadSchema, grupoPagoSchema } from '../schemas/pagoSchema.js';

const router = Router();

router.use(authenticateToken);

router.post('/', checkPermission('pagos', 'WRITE_PAGO'), validate(pagoSchema), crearPago);
router.get('/stats', checkPermission('pagos', 'READ_PAGO'), obtenerEstadisticas);
router.get('/mis-pagos', checkPermission('pagos', 'READ_PAGO'), listarMisPagos);
router.get('/estados', checkPermission('pagos', 'READ_PAGO'), listarEstados);
router.get('/estados/inactivas', checkPermission('pagos', 'READ_PAGO'), listarEstadosInactivos);
router.patch('/estados/:id/recuperar', checkPermission('pagos', 'WRITE_PAGO'), recuperarEstado);
router.get('/grupos', checkPermission('pagos', 'READ_PAGO'), listarGrupos);
router.post('/:id/grupos', checkPermission('pagos', 'WRITE_PAGO'), validate(grupoPagoSchema), asignarGrupoAPago);
router.delete('/:id/grupos/:grupo_id', checkPermission('pagos', 'WRITE_PAGO'), eliminarGrupoDePago);
router.get('/', checkPermission('pagos', 'READ_PAGO'), listarPagos);
router.patch('/:id/estado', checkPermission('pagos', 'WRITE_PAGO'), validate(pagoTrazabilidadSchema), actualizarEstadoPago);
router.get('/:id/trazabilidad', checkPermission('pagos', 'READ_PAGO'), obtenerTrazabilidad);

export default router;
