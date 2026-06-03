import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/authMiddleware.js';
import { checkPermission } from '../../../middlewares/permissionMiddleware.js';
import { validate } from '../../../middlewares/validateMiddleware.js';
import { 
    crearPago, 
    listarPagos, 
    actualizarEstadoPago, 
    obtenerTrazabilidad,
    obtenerEstadisticas,
    listarEstados,
    listarGrupos,
    asignarGrupoAPago,
    eliminarGrupoDePago
} from '../controllers/pagosController.js';
import { pagoSchema, pagoTrazabilidadSchema } from '../schemas/pagoSchema.js';

const router = Router();

router.use(authenticateToken);

router.post('/', checkPermission('pagos', 'WRITE_PAGO'), validate(pagoSchema), crearPago);
router.get('/stats', checkPermission('pagos', 'READ_PAGO'), obtenerEstadisticas);
router.get('/estados', checkPermission('pagos', 'READ_PAGO'), listarEstados);
router.get('/grupos', checkPermission('pagos', 'READ_PAGO'), listarGrupos);
router.post('/:id/grupos', checkPermission('pagos', 'WRITE_PAGO'), asignarGrupoAPago);
router.delete('/:id/grupos/:grupo_id', checkPermission('pagos', 'WRITE_PAGO'), eliminarGrupoDePago);
router.get('/', checkPermission('pagos', 'READ_PAGO'), listarPagos);
router.patch('/:id/estado', checkPermission('pagos', 'WRITE_PAGO'), validate(pagoTrazabilidadSchema), actualizarEstadoPago);
router.get('/:id/trazabilidad', checkPermission('pagos', 'READ_PAGO'), obtenerTrazabilidad);

export default router;
