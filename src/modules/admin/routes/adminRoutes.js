import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/authMiddleware.js';
import { checkPermission } from '../../../middlewares/permissionMiddleware.js';
import { 
    listarUsuarios, 
    actualizarUsuario, 
    resetearPassword, 
    cambiarRol, 
    listarAbogadosActivos, 
    listarAreas,
    crearArea,
    actualizarArea,
    eliminarArea,
    listarCategorias,
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria,
    listarNoisePatterns,
    crearNoisePattern,
    actualizarNoisePattern,
    eliminarNoisePattern,
    obtenerROI,
    actualizarROIConfig,
    obtenerCargaTrabajo,
    obtenerLatenciaOperativa,
    obtenerConfiguracion,
    actualizarConfiguracion
} from '../../../controllers/adminController.js';
import { listarLogs, listarMisLogs } from '../../../controllers/auditController.js';

const router = Router();

router.use(authenticateToken);

// --- Rutas accesibles con permisos del módulo Tutelas ---
router.get('/areas', checkPermission('tutelas', 'READ'), listarAreas);
router.post('/areas', checkPermission('tutelas', 'WRITE'), crearArea);
router.patch('/areas/:id', checkPermission('tutelas', 'WRITE'), actualizarArea);
router.delete('/areas/:id', checkPermission('tutelas', 'WRITE'), eliminarArea);

router.get('/categorias', checkPermission('tutelas', 'READ'), listarCategorias);
router.post('/categorias', checkPermission('tutelas', 'WRITE'), crearCategoria);
router.patch('/categorias/:id', checkPermission('tutelas', 'WRITE'), actualizarCategoria);
router.delete('/categorias/:id', checkPermission('tutelas', 'WRITE'), eliminarCategoria);

router.get('/noise', checkPermission('tutelas', 'READ'), listarNoisePatterns);
router.post('/noise', checkPermission('tutelas', 'WRITE'), crearNoisePattern);
router.patch('/noise/:id', checkPermission('tutelas', 'WRITE'), actualizarNoisePattern);
router.delete('/noise/:id', checkPermission('tutelas', 'WRITE'), eliminarNoisePattern);

// --- Rutas protegidas exclusivamente por ADMIN (Granular) ---

router.get('/config', checkPermission('admin', 'READ'), obtenerConfiguracion);
router.post('/config', checkPermission('admin', 'WRITE'), actualizarConfiguracion);

router.get('/roi', checkPermission('admin', 'READ'), obtenerROI);
router.patch('/roi', checkPermission('admin', 'WRITE'), actualizarROIConfig);
router.get('/carga-trabajo', checkPermission('admin', 'READ'), obtenerCargaTrabajo);
router.get('/latencia', checkPermission('admin', 'READ'), obtenerLatenciaOperativa);

router.get('/usuarios', checkPermission('admin', 'READ'), listarUsuarios);
router.patch('/usuarios/:id', checkPermission('admin', 'WRITE'), actualizarUsuario);
router.patch('/usuarios/:id/rol', checkPermission('admin', 'WRITE'), cambiarRol);
router.post('/usuarios/:id/reset-password', checkPermission('admin', 'WRITE'), resetearPassword);

router.get('/logs', checkPermission('admin', 'READ'), listarLogs);
router.get('/logs/mis-logs', checkPermission('admin', 'READ'), listarMisLogs);

router.get('/abogados-activos', checkPermission('admin', 'READ'), listarAbogadosActivos);

export default router;
