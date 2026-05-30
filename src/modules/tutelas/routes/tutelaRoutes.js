/**
 * Módulo de Tutelas
 * 
 * Define las rutas relacionadas con la gestión, trazabilidad y memoria legal de las tutelas.
 * Este router es cargado dinámicamente por el servidor en 'src/index.js'.
 */
import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../../../middlewares/authMiddleware.js';
import { checkPermission } from '../../../middlewares/permissionMiddleware.js';
import { 
    procesarTutela, 
    descargarWord, 
    entrenarContextoLocal, 
    actualizarGestionTutela, 
    listarTutelas,
    obtenerSugerenciasTutela,
    obtenerHistorialTutela,
    agregarAccionHistorial,
    obtenerContenidoCompletoSugerencia,
    listarBaseConocimiento,
    eliminarBaseConocimiento,
    eliminarTutela,
    listarPapelera,
    restaurarRegistro,
    listarCategorias,
    listarFestivos,
    obtenerEstadisticas,
    actualizarDatosTutela,
    gestionarResponsablesTutela,
    generarBorradorContestacion,
    refinarBorrador,
    crearRequerimientoInterno,
    listarRequerimientosInternos,
    actualizarEstadoRequerimiento
} from '../controllers/tutelaController.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Aplicar autenticación base
router.use(authenticateToken);

/**
 * @swagger
 * /api/tutelas:
 *   get:
 *     summary: Lista todas las tutelas
 *     tags: [Tutelas]
 *     responses:
 *       200:
 *         description: Lista de tutelas obtenida exitosamente
 */
// Gestión de Tutelas
router.get('/', checkPermission('tutelas', 'READ'), listarTutelas); 
/**
 * @swagger
 * /api/tutelas/procesar:
 *   post:
 *     summary: Procesar tutela
 *     tags: [Tutelas]
 *     responses:
 *       200:
 *         description: Éxito
 */
router.post('/procesar', checkPermission('tutelas', 'WRITE'), upload.single('documento'), procesarTutela);
/**
 * @swagger
 * /api/tutelas/{id}:
 *   patch:
 *     summary: Actualizar gestión de tutela
 *     tags: [Tutelas]
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
router.patch('/:id', checkPermission('tutelas', 'WRITE'), actualizarGestionTutela); 
/**
 * @swagger
 * /api/tutelas/{id}:
 *   delete:
 *     summary: Eliminar tutela
 *     tags: [Tutelas]
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
router.delete('/:id', checkPermission('tutelas', 'DELETE'), eliminarTutela);
/**
 * @swagger
 * /api/tutelas/{id}/datos:
 *   patch:
 *     summary: Actualizar datos de tutela
 *     tags: [Tutelas]
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
router.patch('/:id/datos', checkPermission('tutelas', 'WRITE'), actualizarDatosTutela);
/**
 * @swagger
 * /api/tutelas/{id}/responsables:
 *   patch:
 *     summary: Gestionar responsables de tutela
 *     tags: [Tutelas]
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
router.patch('/:id/responsables', checkPermission('tutelas', 'WRITE'), gestionarResponsablesTutela);
/**
 * @swagger
 * /api/tutelas/{id}/descargar:
 *   get:
 *     summary: Descargar tutela
 *     tags: [Tutelas]
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
router.get('/:id/descargar', checkPermission('tutelas', 'READ'), descargarWord);
/**
 * @swagger
 * /api/tutelas/{id}/generar-borrador:
 *   post:
 *     summary: Generar borrador de contestación
 *     tags: [Tutelas]
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
router.post('/:id/generar-borrador', checkPermission('tutelas', 'WRITE'), generarBorradorContestacion);
/**
 * @swagger
 * /api/tutelas/{id}/refinar-borrador:
 *   post:
 *     summary: Refinar borrador
 *     tags: [Tutelas]
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
router.post('/:id/refinar-borrador', checkPermission('tutelas', 'WRITE'), refinarBorrador);
/**
 * @swagger
 * /api/tutelas/{id}/sugerencias:
 *   get:
 *     summary: Obtener sugerencias de tutela
 *     tags: [Tutelas]
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
router.get('/:id/sugerencias', checkPermission('tutelas', 'READ'), obtenerSugerenciasTutela); 
/**
 * @swagger
 * /api/tutelas/documento-referencia/{documento_id}:
 *   get:
 *     summary: Obtener contenido de sugerencia
 *     tags: [Tutelas]
 *     parameters:
 *       - in: path
 *         name: documento_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Éxito
 */
router.get('/documento-referencia/:documento_id', checkPermission('tutelas', 'READ'), obtenerContenidoCompletoSugerencia);

// Requerimientos Internos
/**
 * @swagger
 * /api/tutelas/{id}/requerimientos:
 *   get:
 *     summary: Listar requerimientos internos
 *     tags: [Tutelas]
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
router.get('/:id/requerimientos', checkPermission('tutelas', 'READ'), listarRequerimientosInternos);
/**
 * @swagger
 * /api/tutelas/{id}/requerimientos:
 *   post:
 *     summary: Crear requerimiento interno
 *     tags: [Tutelas]
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
router.post('/:id/requerimientos', checkPermission('tutelas', 'WRITE'), crearRequerimientoInterno);
/**
 * @swagger
 * /api/tutelas/requerimientos/{reqId}:
 *   patch:
 *     summary: Actualizar estado de requerimiento
 *     tags: [Tutelas]
 *     parameters:
 *       - in: path
 *         name: reqId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Éxito
 */
router.patch('/requerimientos/:reqId', checkPermission('tutelas', 'WRITE'), actualizarEstadoRequerimiento);

// Trazabilidad (Log de Acciones)
/**
 * @swagger
 * /api/tutelas/{id}/historial:
 *   get:
 *     summary: Obtener historial de tutela
 *     tags: [Tutelas]
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
router.get('/:id/historial', checkPermission('tutelas', 'READ'), obtenerHistorialTutela);
/**
 * @swagger
 * /api/tutelas/{id}/historial:
 *   post:
 *     summary: Agregar acción al historial
 *     tags: [Tutelas]
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
router.post('/:id/historial', checkPermission('tutelas', 'WRITE'), agregarAccionHistorial);

// Memoria Legal (Búsqueda Semántica)
/**
 * @swagger
 * /api/tutelas/entrenar-local:
 *   post:
 *     summary: Entrenar contexto local
 *     tags: [Tutelas]
 *     responses:
 *       200:
 *         description: Éxito
 */
router.post('/entrenar-local', checkPermission('tutelas', 'WRITE'), upload.single('documento'), entrenarContextoLocal);
/**
 * @swagger
 * /api/tutelas/memoria:
 *   get:
 *     summary: Listar base de conocimiento
 *     tags: [Tutelas]
 *     responses:
 *       200:
 *         description: Éxito
 */
router.get('/memoria', checkPermission('tutelas', 'READ'), listarBaseConocimiento);
/**
 * @swagger
 * /api/tutelas/estadisticas:
 *   get:
 *     summary: Obtener estadísticas
 *     tags: [Tutelas]
 *     responses:
 *       200:
 *         description: Éxito
 */
router.get('/estadisticas', checkPermission('tutelas', 'READ'), obtenerEstadisticas);
/**
 * @swagger
 * /api/tutelas/categorias:
 *   get:
 *     summary: Listar categorías
 *     tags: [Tutelas]
 *     responses:
 *       200:
 *         description: Éxito
 */
router.get('/categorias', checkPermission('tutelas', 'READ'), listarCategorias);
/**
 * @swagger
 * /api/tutelas/festivos:
 *   get:
 *     summary: Listar festivos
 *     tags: [Tutelas]
 *     responses:
 *       200:
 *         description: Éxito
 */
router.get('/festivos', checkPermission('tutelas', 'READ'), listarFestivos);
/**
 * @swagger
 * /api/tutelas/papelera:
 *   get:
 *     summary: Listar papelera
 *     tags: [Tutelas]
 *     responses:
 *       200:
 *         description: Éxito
 */
router.get('/papelera', checkPermission('tutelas', 'READ'), listarPapelera);
/**
 * @swagger
 * /api/tutelas/restaurar:
 *   post:
 *     summary: Restaurar registro
 *     tags: [Tutelas]
 *     responses:
 *       200:
 *         description: Éxito
 */
router.post('/restaurar', checkPermission('tutelas', 'WRITE'), restaurarRegistro);
/**
 * @swagger
 * /api/tutelas/memoria/{documento_id}:
 *   delete:
 *     summary: Eliminar base de conocimiento
 *     tags: [Tutelas]
 *     parameters:
 *       - in: path
 *         name: documento_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Éxito
 */
router.delete('/memoria/:documento_id', checkPermission('tutelas', 'DELETE'), eliminarBaseConocimiento);

export default router;