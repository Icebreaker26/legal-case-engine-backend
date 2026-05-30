import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/authMiddleware.js';
import { listarPermisosUsuario, asignarPermiso, revocarPermiso } from '../controllers/permisosController.js';

const router = Router();

router.use(authenticateToken);

// Endpoints para gestionar permisos
router.get('/usuario/:usuario_id', listarPermisosUsuario);
router.post('/asignar', asignarPermiso);
router.delete('/revocar', revocarPermiso);

export default router;
