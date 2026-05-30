import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/authMiddleware.js';
import { checkPermission } from '../../../middlewares/permissionMiddleware.js';
import { validate } from '../../../middlewares/validateMiddleware.js';
import { 
    registrarAccion, 
    obtenerCumplimientoIndividual, 
    obtenerCumplimientoEquipo, 
    crearObjetivo, 
    listarObjetivos, 
    actualizarObjetivo, 
    eliminarObjetivo,
    archivarObjetivo,
    crearEquipo,
    listarEquipos,
    actualizarEquipo,
    eliminarEquipo
} from '../controllers/rendimientoController.js';
import { objetivoSchema } from '../schemas/objetivoSchema.js';

const router = Router();

router.use(authenticateToken);

// Acciones y Cumplimiento
router.post('/acciones', checkPermission('rendimiento', 'WRITE'), registrarAccion);
router.get('/cumplimiento/individual/:usuario_id', checkPermission('rendimiento', 'READ'), obtenerCumplimientoIndividual);
router.get('/cumplimiento/equipo/:equipo_id', checkPermission('rendimiento', 'READ'), obtenerCumplimientoEquipo);

// CRUD Objetivos
router.post('/objetivos', checkPermission('rendimiento', 'WRITE'), validate(objetivoSchema), crearObjetivo);
router.get('/objetivos', checkPermission('rendimiento', 'READ'), listarObjetivos);
router.patch('/objetivos/:id', checkPermission('rendimiento', 'WRITE'), validate(objetivoSchema.partial()), actualizarObjetivo);
router.delete('/objetivos/:id', checkPermission('rendimiento', 'DELETE'), eliminarObjetivo);
router.patch('/objetivos/:id/archivar', checkPermission('rendimiento', 'WRITE'), archivarObjetivo);

// CRUD Equipos
router.post('/equipos', checkPermission('rendimiento', 'MANAGE_TEAMS'), crearEquipo);
router.get('/equipos', checkPermission('rendimiento', 'READ'), listarEquipos);
router.patch('/equipos/:id', checkPermission('rendimiento', 'MANAGE_TEAMS'), actualizarEquipo);
router.delete('/equipos/:id', checkPermission('rendimiento', 'MANAGE_TEAMS'), eliminarEquipo);

export default router;
