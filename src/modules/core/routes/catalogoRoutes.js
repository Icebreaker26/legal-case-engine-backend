import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/authMiddleware.js';
import { checkPermission } from '../../../middlewares/permissionMiddleware.js';
import { listar, listarInactivos, crear, actualizar, eliminar, recuperar } from '../controllers/catalogoController.js';

const router = Router();

router.use(authenticateToken);

// Rutas genéricas para cualquier catálogo
router.get('/:tipo', checkPermission('admin', 'READ'), listar);
router.get('/:tipo/inactivas', checkPermission('admin', 'READ'), listarInactivos);
router.patch('/:tipo/:id/recuperar', checkPermission('admin', 'WRITE'), recuperar);
router.post('/:tipo', checkPermission('admin', 'WRITE'), crear);
router.patch('/:tipo/:id', checkPermission('admin', 'WRITE'), actualizar);
router.delete('/:tipo/:id', checkPermission('admin', 'DELETE', 'admin'), eliminar);

export default router;
