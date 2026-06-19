import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/authMiddleware.js';
import { checkPermission } from '../../../middlewares/permissionMiddleware.js';
import { validate } from '../../../middlewares/validateMiddleware.js';
import { listar, listarInactivos, crear, actualizar, eliminar, recuperar, listarUsuariosActivos } from '../controllers/catalogoController.js';
import { crearCatalogoSchema, actualizarCatalogoSchema } from '../schemas/catalogoSchema.js';

const router = Router();

router.use(authenticateToken);

// Rutas específicas (deben ir antes del catch-all /:tipo)
router.get('/usuarios-activos', checkPermission('admin', 'READ'), listarUsuariosActivos);

// Rutas genéricas para cualquier catálogo
router.get('/:tipo', checkPermission('perfil', 'READ'), listar);
router.get('/:tipo/inactivas', checkPermission('perfil', 'READ'), listarInactivos);
router.patch('/:tipo/:id/recuperar', checkPermission('perfil', 'WRITE'), recuperar);
router.post('/:tipo',   checkPermission('perfil', 'WRITE'), validate(crearCatalogoSchema),      crear);
router.patch('/:tipo/:id', checkPermission('perfil', 'WRITE'), validate(actualizarCatalogoSchema), actualizar);
router.delete('/:tipo/:id', checkPermission('perfil', 'DELETE', 'admin'), eliminar);

export default router;
