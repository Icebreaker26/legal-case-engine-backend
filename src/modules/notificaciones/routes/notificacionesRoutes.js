import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/authMiddleware.js';
import { listarNotificaciones, marcarComoLeida } from '../controllers/notificacionesController.js';

const router = Router();

router.use(authenticateToken);

router.get('/', listarNotificaciones);
router.patch('/:id/leida', marcarComoLeida);

export default router;
