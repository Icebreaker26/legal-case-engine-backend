import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/authMiddleware.js';
import { checkPermission } from '../../../middlewares/permissionMiddleware.js';
import { listar, listarInactivos, crear, actualizar, eliminar, recuperar } from '../controllers/catalogoController.js';

const router = Router();

router.use(authenticateToken);

// Rutas genéricas para cualquier catálogo
router.get('/:tipo', checkPermission('perfil', 'READ'), listar);
router.get('/:tipo/inactivas', checkPermission('perfil', 'READ'), listarInactivos);
router.patch('/:tipo/:id/recuperar', checkPermission('perfil', 'WRITE'), recuperar);
router.post('/:tipo', checkPermission('perfil', 'WRITE'), crear);
router.patch('/:tipo/:id', checkPermission('perfil', 'WRITE'), actualizar);
router.delete('/:tipo/:id', checkPermission('perfil', 'DELETE', 'admin'), eliminar);

export default router;
