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

// Lectura libre para todos los usuarios autenticados (se usan como selects en toda la app)
router.get('/:tipo',           listar);
router.get('/:tipo/inactivas', listarInactivos);

// Escritura y borrado solo para supervisores
router.patch('/:tipo/:id/recuperar', checkPermission('supervisor', 'WRITE'), recuperar);
router.post('/:tipo',          checkPermission('supervisor', 'WRITE'),  validate(crearCatalogoSchema),      crear);
router.patch('/:tipo/:id',     checkPermission('supervisor', 'WRITE'),  validate(actualizarCatalogoSchema), actualizar);
router.delete('/:tipo/:id',    checkPermission('supervisor', 'DELETE'), eliminar);

export default router;
