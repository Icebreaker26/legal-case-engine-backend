import { Router } from 'express';
import multer from 'multer';
import { listarMinutas, obtenerMinuta, crearMinuta, actualizarMinuta, eliminarMinuta, listarPapelera, restaurarMinuta, eliminarDefinitivamenteMinuta, compararContrato, crearAuditoria, actualizarAuditoria, listarAuditorias, obtenerAuditoria, regenerarPrompt, obtenerDiff } from '../controllers/contratoController.js';
import { authenticateToken } from '../../../middlewares/authMiddleware.js';
import { checkPermission } from '../../../middlewares/permissionMiddleware.js';
import { validate } from '../../../middlewares/validateMiddleware.js';
import { crearMinutaSchema, actualizarMinutaSchema, crearAuditoriaSchema, actualizarAuditoriaSchema, regenerarPromptSchema } from '../schemas/contratoSchema.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/minutas', authenticateToken, checkPermission('contratos', 'READ'), listarMinutas);
router.get('/minutas/papelera', authenticateToken, checkPermission('contratos', 'READ'), listarPapelera);
router.patch('/minutas/:id/restaurar', authenticateToken, checkPermission('contratos', 'WRITE'), restaurarMinuta);
router.delete('/minutas/:id/definitivo', authenticateToken, checkPermission('contratos', 'DELETE'), eliminarDefinitivamenteMinuta);
router.post('/minutas',   authenticateToken, checkPermission('contratos', 'WRITE'), validate(crearMinutaSchema),      crearMinuta);
router.patch('/minutas/:id', authenticateToken, checkPermission('contratos', 'WRITE'), validate(actualizarMinutaSchema), actualizarMinuta);
router.delete('/minutas/:id', authenticateToken, checkPermission('contratos', 'DELETE'), eliminarMinuta);
router.get('/minutas/:id', authenticateToken, checkPermission('contratos', 'READ'), obtenerMinuta);
router.post('/auditorias/comparar', authenticateToken, checkPermission('contratos', 'WRITE'), upload.single('file'), compararContrato);
router.post('/auditorias',                      authenticateToken, checkPermission('contratos', 'WRITE'), validate(crearAuditoriaSchema),      crearAuditoria);
router.post('/auditorias/:id/regenerar-prompt', authenticateToken, checkPermission('contratos', 'WRITE'), validate(regenerarPromptSchema),     regenerarPrompt);
router.get('/auditorias/:id/diff',              authenticateToken, checkPermission('contratos', 'READ'),  obtenerDiff);
router.patch('/auditorias/:id',                 authenticateToken, checkPermission('contratos', 'WRITE'), validate(actualizarAuditoriaSchema), actualizarAuditoria);
router.get('/auditorias/:id', authenticateToken, checkPermission('contratos', 'READ'), obtenerAuditoria);
router.get('/auditorias', authenticateToken, checkPermission('contratos', 'READ'), listarAuditorias);

export default router;
