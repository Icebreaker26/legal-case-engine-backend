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

/**
 * @swagger
 * /api/admin/config:
 *   get:
 *     summary: Obtener configuración
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Éxito
 */
router.get('/config', obtenerConfiguracion);
/**
 * @swagger
 * /api/admin/abogados-activos:
 *   get:
 *     summary: Listar abogados activos
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Éxito
 */
router.get('/abogados-activos', listarAbogadosActivos);
/**
 * @swagger
 * /api/admin/areas:
 *   get:
 *     summary: Listar áreas
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Éxito
 */
router.get('/areas', listarAreas);
/**
 * @swagger
 * /api/admin/areas:
 *   post:
 *     summary: Crear área
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Éxito
 */
router.post('/areas', crearArea);
/**
 * @swagger
 * /api/admin/areas/{id}:
 *   patch:
 *     summary: Actualizar área
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Éxito
 */
router.patch('/areas/:id', actualizarArea);
/**
 * @swagger
 * /api/admin/areas/{id}:
 *   delete:
 *     summary: Eliminar área
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Éxito
 */
router.delete('/areas/:id', eliminarArea);

/**
 * @swagger
 * /api/admin/categorias:
 *   get:
 *     summary: Listar categorías
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Éxito
 */
router.get('/categorias', listarCategorias);
/**
 * @swagger
 * /api/admin/categorias:
 *   post:
 *     summary: Crear categoría
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Éxito
 */
router.post('/categorias', crearCategoria);
/**
 * @swagger
 * /api/admin/categorias/{id}:
 *   patch:
 *     summary: Actualizar categoría
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Éxito
 */
router.patch('/categorias/:id', actualizarCategoria);
/**
 * @swagger
 * /api/admin/categorias/{id}:
 *   delete:
 *     summary: Eliminar categoría
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Éxito
 */
router.delete('/categorias/:id', eliminarCategoria);

/**
 * @swagger
 * /api/admin/noise:
 *   get:
 *     summary: Listar patrones de ruido
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Éxito
 */
router.get('/noise', listarNoisePatterns);
/**
 * @swagger
 * /api/admin/noise:
 *   post:
 *     summary: Crear patrón de ruido
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Éxito
 */
router.post('/noise', crearNoisePattern);
/**
 * @swagger
 * /api/admin/noise/{id}:
 *   patch:
 *     summary: Actualizar patrón de ruido
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Éxito
 */
router.patch('/noise/:id', actualizarNoisePattern);
/**
 * @swagger
 * /api/admin/noise/{id}:
 *   delete:
 *     summary: Eliminar patrón de ruido
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Éxito
 */
router.delete('/noise/:id', eliminarNoisePattern);

/**
 * @swagger
 * /api/admin/roi:
 *   get:
 *     summary: Obtener ROI
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Éxito
 */
router.get('/roi', obtenerROI);
/**
 * @swagger
 * /api/admin/roi:
 *   patch:
 *     summary: Actualizar configuración de ROI
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Éxito
 */
router.patch('/roi', actualizarROIConfig);
/**
 * @swagger
 * /api/admin/carga-trabajo:
 *   get:
 *     summary: Obtener carga de trabajo
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Éxito
 */
router.get('/carga-trabajo', obtenerCargaTrabajo);
/**
 * @swagger
 * /api/admin/latencia:
 *   get:
 *     summary: Obtener latencia operativa
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Éxito
 */
router.get('/latencia', obtenerLatenciaOperativa);

router.use(isAdmin);
/**
 * @swagger
 * /api/admin/usuarios:
 *   get:
 *     summary: Listar usuarios
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Éxito
 */
router.get('/usuarios', listarUsuarios);
/**
 * @swagger
 * /api/admin/usuarios/{id}:
 *   patch:
 *     summary: Actualizar usuario
 *     tags:
 *       - Admin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Éxito
 */
router.patch('/usuarios/:id', actualizarUsuario);
/**
 * @swagger
 * /api/admin/usuarios/{id}/rol:
 *   patch:
 *     summary: Cambiar rol de usuario
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Éxito
 */
router.patch('/usuarios/:id/rol', cambiarRol);
/**
 * @swagger
 * /api/admin/usuarios/{id}/reset-password:
 *   post:
 *     summary: Resetear contraseña de usuario
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Éxito
 */
router.post('/usuarios/:id/reset-password', resetearPassword);
/**
 * @swagger
 * /api/admin/config:
 *   post:
 *     summary: Actualizar configuración
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Éxito
 */
router.post('/config', actualizarConfiguracion);
/**
 * @swagger
 * /api/admin/logs:
 *   get:
 *     summary: Listar logs
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Éxito
 */
router.get('/logs', listarLogs);

export default router;