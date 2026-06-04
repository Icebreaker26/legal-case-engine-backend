import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/authMiddleware.js';
import { checkPermission } from '../../../middlewares/permissionMiddleware.js';
import { validate } from '../../../middlewares/validateMiddleware.js';
import { 
    crearObjetivo, 
    listarObjetivos, 
    listarMisObjetivos,
    actualizarObjetivo, 
    eliminarObjetivo
} from '../controllers/objetivoController.js';
import { 
    registrarAccion, 
    obtenerCumplimientoIndividual, 
    obtenerCumplimientoEquipo,
    obtenerHistorialEquipo,
    obtenerCumplimientoGlobal,
    obtenerHistorialAccionesObjetivo,
    exportarDatosEquipo,
    listarObjetivosPorEquipo,
    archivarObjetivo,
    crearEquipo,
    listarEquipos,
    listarEquiposEliminados,
    restaurarEquipo,
    actualizarEquipo,
    eliminarEquipo,
    asignarUsuarioAEquipo,
    removerUsuarioDeEquipo
} from '../controllers/rendimientoController.js';
import { objetivoSchema } from '../schemas/objetivoSchema.js';

const router = Router();

router.use(authenticateToken);

// Acciones y Cumplimiento
router.get('/cumplimiento/global', checkPermission('rendimiento', 'READ'), obtenerCumplimientoGlobal);
router.get('/objetivos/:objetivo_id/acciones', checkPermission('rendimiento', 'READ'), obtenerHistorialAccionesObjetivo);
router.post('/acciones', checkPermission('rendimiento', 'WRITE'), registrarAccion);
router.get('/cumplimiento/individual/:usuario_id', checkPermission('rendimiento', 'READ'), obtenerCumplimientoIndividual);
router.get('/cumplimiento/equipo/:equipo_id', checkPermission('rendimiento', 'READ'), obtenerCumplimientoEquipo);
router.get('/historial/equipo/:equipo_id', checkPermission('rendimiento', 'READ'), obtenerHistorialEquipo);
router.get('/objetivos/equipo/:equipo_id', checkPermission('rendimiento', 'READ'), listarObjetivosPorEquipo);
router.get('/equipos/:equipo_id/exportar-completo', checkPermission('rendimiento', 'MANAGE_TEAMS'), exportarDatosEquipo);

// CRUD Objetivos
router.post('/objetivos', checkPermission('rendimiento', 'WRITE'), validate(objetivoSchema), crearObjetivo);
router.get('/mis-objetivos', checkPermission('rendimiento', 'READ'), listarMisObjetivos);
router.get('/objetivos', checkPermission('rendimiento', 'READ'), listarObjetivos);
router.patch('/objetivos/:id', checkPermission('rendimiento', 'WRITE'), validate(objetivoSchema.partial()), actualizarObjetivo);
router.delete('/objetivos/:id', checkPermission('rendimiento', 'DELETE'), eliminarObjetivo);
router.patch('/objetivos/:id/archivar', checkPermission('rendimiento', 'WRITE'), archivarObjetivo);

// CRUD Equipos
router.post('/equipos', checkPermission('rendimiento', 'MANAGE_TEAMS'), crearEquipo);
router.get('/equipos', checkPermission('rendimiento', 'READ'), listarEquipos);
router.get('/equipos/eliminados', checkPermission('rendimiento', 'MANAGE_TEAMS'), listarEquiposEliminados);
router.patch('/equipos/:id/restaurar', checkPermission('rendimiento', 'MANAGE_TEAMS'), restaurarEquipo);
router.patch('/equipos/remover-usuario', checkPermission('rendimiento', 'MANAGE_TEAMS'), removerUsuarioDeEquipo);
router.patch('/equipos/:id', checkPermission('rendimiento', 'MANAGE_TEAMS'), actualizarEquipo);
router.delete('/equipos/:id', checkPermission('rendimiento', 'MANAGE_TEAMS'), eliminarEquipo);
router.post('/equipos/asignar', checkPermission('rendimiento', 'MANAGE_TEAMS'), asignarUsuarioAEquipo);

export default router;
