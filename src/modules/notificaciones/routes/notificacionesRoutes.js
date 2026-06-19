import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/authMiddleware.js';
import { listarNotificaciones, marcarComoLeida, marcarTodasLeidas, eliminarNotificacion, eliminarTodasLeidas } from '../controllers/notificacionesController.js';

const router = Router();

router.use(authenticateToken);

router.get('/',                    listarNotificaciones);
router.patch('/:id/leida',         marcarComoLeida);
router.patch('/todas/leidas',      marcarTodasLeidas);
router.delete('/:id',              eliminarNotificacion);
router.delete('/leidas/limpiar',   eliminarTodasLeidas);

export default router;
