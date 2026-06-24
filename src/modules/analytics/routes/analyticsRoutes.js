import { Router } from 'express';
import {
  getScoreRiesgo,
  getTiempoRespuestaArea,
  getPatronesFallo,
  getEficienciaRAG,
  getCargaAbogados,
} from '../controllers/analyticsController.js';
import { authenticateToken } from '../../../middlewares/authMiddleware.js';
import { checkPermission } from '../../../middlewares/permissionMiddleware.js';

const router = Router();

router.get('/score-riesgo',          authenticateToken, checkPermission('tutelas', 'READ'), getScoreRiesgo);
router.get('/tiempo-respuesta-area', authenticateToken, checkPermission('tutelas', 'READ'), getTiempoRespuestaArea);
router.get('/patrones-fallo',        authenticateToken, checkPermission('tutelas', 'READ'), getPatronesFallo);
router.get('/eficiencia-rag',        authenticateToken, checkPermission('tutelas', 'READ'), getEficienciaRAG);
router.get('/carga-abogados',        authenticateToken, checkPermission('tutelas', 'READ'), getCargaAbogados);

export default router;
