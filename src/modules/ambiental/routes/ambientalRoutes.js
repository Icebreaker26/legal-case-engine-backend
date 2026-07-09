import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../../../middlewares/authMiddleware.js';
import { checkPermission } from '../../../middlewares/permissionMiddleware.js';
import { validate } from '../../../middlewares/validateMiddleware.js';
import { crearExpedienteSchema, actualizarExpedienteSchema, guardarAnalisisSchema } from '../schemas/ambientalSchema.js';
import {
  procesarDocumento,
  crearExpediente,
  listarExpedientes,
  obtenerExpediente,
  actualizarExpediente,
  eliminarExpediente,
  guardarAnalisis,
  consolidarResumen,
  actualizarEstadoPago,
  desactivarPago,
  listarPagosInactivos,
  reactivarPago,
  obtenerAnalisis,
  obtenerDatosInforme,
  obtenerCalendario,
  obtenerDashboard,
  listarComunicaciones,
  crearComunicacion,
  eliminarComunicacion,
  listarComunicacionesInactivas,
  reactivarComunicacion,
  actualizarEnlaceComunicacion,
  generarPromptAnalisisComunicacion,
  guardarResultadoLlmComunicacion,
  obtenerSimilares,
  generarPromptComparativo,
  generarEmbeddingExpediente,
  obtenerBibliotecaEstadisticas,
  obtenerBibliotecaClusters,
  recalcularBibliotecaClusters,
  listarTerminosIgnorados,
  ignorarTermino,
  restaurarTermino,
  obtenerBibliotecaProyeccion,
} from '../controllers/ambientalController.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 60 * 1024 * 1024 },
});

router.post('/expedientes/procesar', authenticateToken, checkPermission('ambiental', 'WRITE'), upload.single('file'), procesarDocumento);
router.post('/expedientes',          authenticateToken, checkPermission('ambiental', 'WRITE'), validate(crearExpedienteSchema), crearExpediente);
router.get('/expedientes',           authenticateToken, checkPermission('ambiental', 'READ'),  listarExpedientes);
router.get('/expedientes/:id',       authenticateToken, checkPermission('ambiental', 'READ'),  obtenerExpediente);
router.patch('/expedientes/:id',     authenticateToken, checkPermission('ambiental', 'WRITE'), validate(actualizarExpedienteSchema), actualizarExpediente);
router.delete('/expedientes/:id',    authenticateToken, checkPermission('ambiental', 'DELETE'), eliminarExpediente);
router.post('/expedientes/:id/analisis',             authenticateToken, checkPermission('ambiental', 'WRITE'), validate(guardarAnalisisSchema), guardarAnalisis);
router.patch('/expedientes/:id/analisis/resumen',    authenticateToken, checkPermission('ambiental', 'WRITE'), consolidarResumen);
router.patch('/expedientes/:id/pagos/:pagoId',           authenticateToken, checkPermission('ambiental', 'WRITE'),  actualizarEstadoPago);
router.delete('/expedientes/:id/pagos/:pagoId',          authenticateToken, checkPermission('ambiental', 'DELETE'), desactivarPago);
router.get('/expedientes/:id/pagos/inactivos',           authenticateToken, checkPermission('ambiental', 'READ'),   listarPagosInactivos);
router.patch('/expedientes/:id/pagos/:pagoId/reactivar', authenticateToken, checkPermission('ambiental', 'WRITE'),  reactivarPago);
router.get('/expedientes/:id/analisis',  authenticateToken, checkPermission('ambiental', 'READ'),  obtenerAnalisis);
router.get('/expedientes/:id/informe',   authenticateToken, checkPermission('ambiental', 'READ'),  obtenerDatosInforme);
router.get('/expedientes/:id/comunicaciones',                        authenticateToken, checkPermission('ambiental', 'READ'),   listarComunicaciones);
router.get('/expedientes/:id/comunicaciones/inactivas',              authenticateToken, checkPermission('ambiental', 'READ'),   listarComunicacionesInactivas);
router.post('/expedientes/:id/comunicaciones',                       authenticateToken, checkPermission('ambiental', 'WRITE'),  upload.single('file'), crearComunicacion);
router.delete('/expedientes/:id/comunicaciones/:cId',                authenticateToken, checkPermission('ambiental', 'DELETE'), eliminarComunicacion);
router.patch('/expedientes/:id/comunicaciones/:cId/reactivar',       authenticateToken, checkPermission('ambiental', 'WRITE'),  reactivarComunicacion);
router.patch('/expedientes/:id/comunicaciones/:cId/enlace',          authenticateToken, checkPermission('ambiental', 'WRITE'),  actualizarEnlaceComunicacion);
router.post('/expedientes/:id/comunicaciones/:cId/prompt-analisis',  authenticateToken, checkPermission('ambiental', 'WRITE'),  generarPromptAnalisisComunicacion);
router.patch('/expedientes/:id/comunicaciones/:cId/resultado-llm',   authenticateToken, checkPermission('ambiental', 'WRITE'),  guardarResultadoLlmComunicacion);
router.get('/expedientes/:id/similares',             authenticateToken, checkPermission('ambiental', 'READ'),  obtenerSimilares);
router.post('/expedientes/:id/generar-embedding',    authenticateToken, checkPermission('ambiental', 'WRITE'), generarEmbeddingExpediente);
router.post('/expedientes/:id/prompt-comparativo',   authenticateToken, checkPermission('ambiental', 'WRITE'), generarPromptComparativo);
router.get('/calendario',  authenticateToken, checkPermission('ambiental', 'READ'),  obtenerCalendario);
router.get('/dashboard',   authenticateToken, checkPermission('ambiental', 'READ'),  obtenerDashboard);
router.get('/biblioteca/estadisticas',          authenticateToken, checkPermission('ambiental', 'READ'),   obtenerBibliotecaEstadisticas);
router.get('/biblioteca/clusters',              authenticateToken, checkPermission('ambiental', 'READ'),   obtenerBibliotecaClusters);
router.post('/biblioteca/recalcular',           authenticateToken, checkPermission('ambiental', 'WRITE'),  recalcularBibliotecaClusters);
router.get('/biblioteca/proyeccion',            authenticateToken, checkPermission('ambiental', 'READ'),   obtenerBibliotecaProyeccion);
router.get('/biblioteca/terminos-ignorados',    authenticateToken, checkPermission('ambiental', 'READ'),   listarTerminosIgnorados);
router.post('/biblioteca/terminos-ignorados',   authenticateToken, checkPermission('ambiental', 'WRITE'),  ignorarTermino);
router.delete('/biblioteca/terminos-ignorados/:word', authenticateToken, checkPermission('ambiental', 'WRITE'), restaurarTermino);

export default router;
