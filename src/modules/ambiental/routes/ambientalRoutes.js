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
  procesarRespuestaEntidad,
  listarComunicaciones,
  crearComunicacion,
  eliminarComunicacion,
  listarComunicacionesInactivas,
  reactivarComunicacion,
  obtenerSimilares,
  generarPromptComparativo,
} from '../controllers/ambientalController.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 60 * 1024 * 1024 }, // 60 MB
});

router.post('/expedientes/procesar', authenticateToken, checkPermission('ambiental', 'WRITE'), upload.single('file'), procesarDocumento);
router.post('/expedientes',          authenticateToken, checkPermission('ambiental', 'WRITE'), validate(crearExpedienteSchema), crearExpediente);
router.get('/expedientes',           authenticateToken, checkPermission('ambiental', 'READ'),  listarExpedientes);
router.get('/expedientes/:id',       authenticateToken, checkPermission('ambiental', 'READ'),  obtenerExpediente);
router.patch('/expedientes/:id',     authenticateToken, checkPermission('ambiental', 'WRITE'), validate(actualizarExpedienteSchema), actualizarExpediente);
router.delete('/expedientes/:id',    authenticateToken, checkPermission('ambiental', 'DELETE'), eliminarExpediente);
router.post('/expedientes/:id/analisis',          authenticateToken, checkPermission('ambiental', 'WRITE'), validate(guardarAnalisisSchema), guardarAnalisis);
router.patch('/expedientes/:id/analisis/resumen',    authenticateToken, checkPermission('ambiental', 'WRITE'), consolidarResumen);
router.patch('/expedientes/:id/pagos/:pagoId',         authenticateToken, checkPermission('ambiental', 'WRITE'), actualizarEstadoPago);
router.delete('/expedientes/:id/pagos/:pagoId',          authenticateToken, checkPermission('ambiental', 'DELETE'), desactivarPago);
router.get('/expedientes/:id/pagos/inactivos',           authenticateToken, checkPermission('ambiental', 'READ'),   listarPagosInactivos);
router.patch('/expedientes/:id/pagos/:pagoId/reactivar', authenticateToken, checkPermission('ambiental', 'WRITE'),  reactivarPago);
router.get('/expedientes/:id/analisis',           authenticateToken, checkPermission('ambiental', 'READ'),  obtenerAnalisis);
router.get('/expedientes/:id/informe',   authenticateToken, checkPermission('ambiental', 'READ'),  obtenerDatosInforme);
router.post('/expedientes/:id/respuesta', authenticateToken, checkPermission('ambiental', 'WRITE'), upload.single('file'), procesarRespuestaEntidad);
router.get('/expedientes/:id/comunicaciones',                        authenticateToken, checkPermission('ambiental', 'READ'),   listarComunicaciones);
router.get('/expedientes/:id/comunicaciones/inactivas',              authenticateToken, checkPermission('ambiental', 'READ'),   listarComunicacionesInactivas);
router.post('/expedientes/:id/comunicaciones',                       authenticateToken, checkPermission('ambiental', 'WRITE'),  upload.single('file'), crearComunicacion);
router.delete('/expedientes/:id/comunicaciones/:cId',                authenticateToken, checkPermission('ambiental', 'DELETE'), eliminarComunicacion);
router.patch('/expedientes/:id/comunicaciones/:cId/reactivar',       authenticateToken, checkPermission('ambiental', 'WRITE'),  reactivarComunicacion);
router.get('/expedientes/:id/similares',           authenticateToken, checkPermission('ambiental', 'READ'),  obtenerSimilares);
router.post('/expedientes/:id/prompt-comparativo', authenticateToken, checkPermission('ambiental', 'WRITE'), generarPromptComparativo);
router.get('/calendario',                authenticateToken, checkPermission('ambiental', 'READ'),  obtenerCalendario);
router.get('/dashboard',                 authenticateToken, checkPermission('ambiental', 'READ'),  obtenerDashboard);

export default router;
