import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/authMiddleware.js';
import { checkPermission } from '../../../middlewares/permissionMiddleware.js';
import { validate } from '../../../middlewares/validateMiddleware.js';
import { consultar } from '../controllers/reportesController.js';
import { reportesFiltrosSchema } from '../schemas/reportesSchema.js';

const router = Router();

router.use(authenticateToken);

router.post('/consultar', checkPermission('reportes', 'READ'), validate(reportesFiltrosSchema), consultar);

export default router;
