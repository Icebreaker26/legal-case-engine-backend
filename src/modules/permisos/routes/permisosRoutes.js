import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/authMiddleware.js';
import { checkPermission } from '../../../middlewares/permissionMiddleware.js';
import { validate } from '../../../middlewares/validateMiddleware.js';
import { listarMisPermisos, listarPermisosUsuario, asignarPermiso, asignarPermisosMasivo, revocarPermiso } from '../controllers/permisosController.js';
import { asignarPermisoSchema, revocarPermisoSchema, asignarMasivoSchema } from '../schemas/permisosSchema.js';

const router = Router();

router.use(authenticateToken);

router.get('/mis-permisos',          listarMisPermisos);
router.get('/usuario/:usuario_uuid', checkPermission('admin', 'READ'),   listarPermisosUsuario);
router.post('/asignar',              checkPermission('admin', 'WRITE'),  validate(asignarPermisoSchema),  asignarPermiso);
router.post('/asignar-masivo',       checkPermission('admin', 'WRITE'),  validate(asignarMasivoSchema),   asignarPermisosMasivo);
router.delete('/revocar',            checkPermission('admin', 'DELETE'), validate(revocarPermisoSchema),  revocarPermiso);

export default router;
