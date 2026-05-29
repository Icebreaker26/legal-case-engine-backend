import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/authMiddleware.js';
import { isAdmin } from '../../../middlewares/adminMiddleware.js';
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
import { listarLogs } from '../../../controllers/auditController.js';

const router = Router();

router.use(authenticateToken);

router.get('/config', obtenerConfiguracion);
router.get('/abogados-activos', listarAbogadosActivos);
router.get('/areas', listarAreas);
router.post('/areas', crearArea);
router.patch('/areas/:id', actualizarArea);
router.delete('/areas/:id', eliminarArea);

router.get('/categorias', listarCategorias);
router.post('/categorias', crearCategoria);
router.patch('/categorias/:id', actualizarCategoria);
router.delete('/categorias/:id', eliminarCategoria);

router.get('/noise', listarNoisePatterns);
router.post('/noise', crearNoisePattern);
router.patch('/noise/:id', actualizarNoisePattern);
router.delete('/noise/:id', eliminarNoisePattern);

router.get('/roi', obtenerROI);
router.patch('/roi', actualizarROIConfig);
router.get('/carga-trabajo', obtenerCargaTrabajo);
router.get('/latencia', obtenerLatenciaOperativa);

router.use(isAdmin);
router.get('/usuarios', listarUsuarios);
router.patch('/usuarios/:id', actualizarUsuario);
router.patch('/usuarios/:id/rol', cambiarRol);
router.post('/usuarios/:id/reset-password', resetearPassword);
router.post('/config', actualizarConfiguracion);
router.get('/logs', listarLogs);

export default router;
