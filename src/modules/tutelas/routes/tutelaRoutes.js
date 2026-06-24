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
    listarMisTutelas,
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
    guardarBorrador,
    crearRequerimientoInterno,
    listarRequerimientosInternos,
    actualizarEstadoRequerimiento,
    obtenerEstadoBloqueo,
    bloquearBorrador,
    desbloquearBorrador,
    actualizarBorrador,
    listarArgumentos,
    crearArgumento,
    actualizarArgumento,
    eliminarArgumento,
    promoverArgumento,
    registrarFeedbackMemoria,
    generarPromptsPeticion,
    guardarRespuestaPeticion,
    obtenerRespuestaPeticion,
    limpiarRespuestaPeticion,
} from '../controllers/tutelaController.js';

import { listarRequerimientosPorArea as listarReqArea, responderRequerimientoPorArea as responderReqArea } from '../controllers/requerimientoController.js';
import {
    listarNoisePatterns, crearNoisePattern, actualizarNoisePattern, eliminarNoisePattern,
    obtenerConfiguracion, actualizarConfiguracion,
    obtenerROI, actualizarROIConfig,
    obtenerCargaTrabajo, obtenerLatenciaOperativa,
} from '../controllers/tutelaAdminController.js';
import { listarLogs, listarMisLogs } from '../controllers/auditController.js';
import { validate } from '../../../middlewares/validateMiddleware.js';
import {
    actualizarGestionSchema,
    actualizarDatosSchema,
    gestionarResponsablesSchema,
    restaurarSchema,
    agregarHistorialSchema,
    guardarBorradorSchema,
    actualizarBorradorSchema,
    feedbackMemoriaSchema,
    crearRequerimientoSchema,
    actualizarRequerimientoSchema,
    responderRequerimientoSchema,
    crearArgumentoSchema,
    actualizarArgumentoSchema,
    asignarUsuariosSchema,
    crearNoiseSchema,
    actualizarNoiseSchema,
    actualizarROISchema,
    actualizarConfigSchema,
    guardarRespuestaPeticionSchema,
} from '../schemas/tutelaSchema.js';


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
// ── Rutas fijas — deben ir ANTES de /:id para que Express no las capture como parámetro ──
router.get('/estadisticas',    checkPermission('tutelas', 'READ'),  obtenerEstadisticas);
router.get('/categorias',      checkPermission('tutelas', 'READ'),  listarCategorias);
router.get('/festivos',        checkPermission('tutelas', 'READ'),  listarFestivos);
router.get('/papelera',        checkPermission('tutelas', 'READ'),  listarPapelera);
router.post('/restaurar',      checkPermission('tutelas', 'WRITE'), validate(restaurarSchema),  restaurarRegistro);
router.get('/memoria',         checkPermission('tutelas', 'READ'),  listarBaseConocimiento);
router.post('/entrenar-local', checkPermission('tutelas', 'WRITE'), upload.single('documento'), entrenarContextoLocal);
router.get('/config',          checkPermission('tutelas', 'READ'),  obtenerConfiguracion);
router.post('/config',         checkPermission('tutelas', 'WRITE'), validate(actualizarConfigSchema), actualizarConfiguracion);
router.get('/noise',           checkPermission('tutelas', 'READ'),  listarNoisePatterns);
router.post('/noise',          checkPermission('tutelas', 'WRITE'), validate(crearNoiseSchema),        crearNoisePattern);
router.patch('/noise/:id',     checkPermission('tutelas', 'WRITE'), validate(actualizarNoiseSchema),   actualizarNoisePattern);
router.delete('/noise/:id',    checkPermission('tutelas', 'WRITE'), eliminarNoisePattern);
router.get('/roi',             checkPermission('tutelas', 'READ'),  obtenerROI);
router.patch('/roi',           checkPermission('tutelas', 'WRITE'), validate(actualizarROISchema),     actualizarROIConfig);
router.get('/carga-trabajo',   checkPermission('tutelas', 'READ'),  obtenerCargaTrabajo);
router.get('/latencia',        checkPermission('tutelas', 'READ'),  obtenerLatenciaOperativa);
router.get('/logs',            checkPermission('tutelas', 'READ'),  listarLogs);
router.get('/logs/mis-logs',   checkPermission('tutelas', 'READ'),  listarMisLogs);
router.get('/requerimientos/area/:area',              checkPermission('tutelas', 'READ'),  listarReqArea);
router.patch('/requerimientos/:reqId/responder-area', checkPermission('tutelas', 'WRITE'), validate(responderRequerimientoSchema), responderReqArea);
router.patch('/requerimientos/:reqId',                checkPermission('tutelas', 'WRITE'), validate(actualizarRequerimientoSchema), actualizarEstadoRequerimiento);
router.get('/documento-referencia/:documento_id',     checkPermission('tutelas', 'READ'),  obtenerContenidoCompletoSugerencia);
router.post('/memoria/:documento_id/feedback',        checkPermission('tutelas', 'WRITE'), validate(feedbackMemoriaSchema), registrarFeedbackMemoria);
router.delete('/memoria/:documento_id',               checkPermission('tutelas', 'DELETE'), eliminarBaseConocimiento);

// ── Gestión de Tutelas ────────────────────────────────────────────────────────
router.get('/mis-tutelas', checkPermission('tutelas', 'READ'), listarMisTutelas);
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
router.patch('/:id', checkPermission('tutelas', 'WRITE'), validate(actualizarGestionSchema), actualizarGestionTutela);
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
router.patch('/:id/datos', checkPermission('tutelas', 'WRITE'), validate(actualizarDatosSchema), actualizarDatosTutela);
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
router.patch('/:id/responsables', checkPermission('tutelas', 'WRITE'), validate(gestionarResponsablesSchema), gestionarResponsablesTutela);
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
router.post('/:id/guardar-borrador', checkPermission('tutelas', 'WRITE'), validate(guardarBorradorSchema), guardarBorrador);
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
// ── Rutas con parámetro /:id — van después de las rutas fijas ────────────────

// Requerimientos por tutela
router.get('/:id/requerimientos',  checkPermission('tutelas', 'READ'),  listarRequerimientosInternos);
router.post('/:id/requerimientos', checkPermission('tutelas', 'WRITE'), validate(crearRequerimientoSchema), crearRequerimientoInterno);

// Historial
router.get('/:id/historial',  checkPermission('tutelas', 'READ'),  obtenerHistorialTutela);
router.post('/:id/historial', checkPermission('tutelas', 'WRITE'), validate(agregarHistorialSchema), agregarAccionHistorial);

// Sugerencias RAG
router.get('/:id/sugerencias', checkPermission('tutelas', 'READ'), obtenerSugerenciasTutela);

// Bloqueo Optimista para Borradores
router.get('/:id/lock-status', checkPermission('tutelas', 'READ'), obtenerEstadoBloqueo);
router.post('/:id/lock', checkPermission('tutelas', 'WRITE'), bloquearBorrador);
router.post('/:id/unlock', checkPermission('tutelas', 'WRITE'), desbloquearBorrador);
router.patch('/:id/borrador', checkPermission('tutelas', 'WRITE'), validate(actualizarBorradorSchema), actualizarBorrador);

// Argumentos Personalizados
router.get('/:id/argumentos', checkPermission('tutelas', 'READ'), listarArgumentos);
router.post('/:id/argumentos', checkPermission('tutelas', 'WRITE'), validate(crearArgumentoSchema), crearArgumento);
router.patch('/:id/argumentos/:argId', checkPermission('tutelas', 'WRITE'), validate(actualizarArgumentoSchema), actualizarArgumento);
router.delete('/:id/argumentos/:argId', checkPermission('tutelas', 'DELETE'), eliminarArgumento);
router.post('/:id/argumentos/:argId/promover', checkPermission('tutelas', 'WRITE'), promoverArgumento);

// Generación de prompts y respuestas de petición
router.post('/:id/generar-prompts-peticion',  checkPermission('tutelas', 'WRITE'), generarPromptsPeticion);
router.get('/:id/respuesta-peticion',          checkPermission('tutelas', 'READ'),  obtenerRespuestaPeticion);
router.post('/:id/respuesta-peticion',         checkPermission('tutelas', 'WRITE'), validate(guardarRespuestaPeticionSchema), guardarRespuestaPeticion);
router.delete('/:id/respuesta-peticion',       checkPermission('tutelas', 'DELETE'), limpiarRespuestaPeticion);

export default router;