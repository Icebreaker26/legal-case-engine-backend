import { Router } from 'express';
import multer from 'multer';
import { checkPermission } from '../../../middlewares/checkPermission.js';
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
  obtenerAnalisis,
  obtenerDatosInforme,
} from '../controllers/ambientalController.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/expedientes/procesar', checkPermission('ambiental', 'WRITE'), upload.single('file'), procesarDocumento);
router.post('/expedientes',          checkPermission('ambiental', 'WRITE'), validate(crearExpedienteSchema), crearExpediente);
router.get('/expedientes',           checkPermission('ambiental', 'READ'),  listarExpedientes);
router.get('/expedientes/:id',       checkPermission('ambiental', 'READ'),  obtenerExpediente);
router.patch('/expedientes/:id',     checkPermission('ambiental', 'WRITE'), validate(actualizarExpedienteSchema), actualizarExpediente);
router.delete('/expedientes/:id',    checkPermission('ambiental', 'DELETE'), eliminarExpediente);
router.post('/expedientes/:id/analisis', checkPermission('ambiental', 'WRITE'), validate(guardarAnalisisSchema), guardarAnalisis);
router.get('/expedientes/:id/analisis',  checkPermission('ambiental', 'READ'),  obtenerAnalisis);
router.get('/expedientes/:id/informe',   checkPermission('ambiental', 'READ'),  obtenerDatosInforme);

export default router;
