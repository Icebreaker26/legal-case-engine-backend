import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/authMiddleware.js';
import { checkPermission } from '../../../middlewares/permissionMiddleware.js';
import { validate } from '../../../middlewares/validateMiddleware.js';
import {
    listarUsuarios,
    actualizarUsuario,
    resetearPassword,
    cambiarRol,
    listarAreas,
    crearArea,
    actualizarArea,
    eliminarArea,
} from '../controllers/adminController.js';
import {
    crearAreaSchema,
    actualizarAreaSchema,
    actualizarUsuarioSchema,
    cambiarRolSchema,
    resetearPasswordSchema,
} from '../schemas/adminSchema.js';

const router = Router();

router.use(authenticateToken);

// ── Áreas / equipos ───────────────────────────────────────────────────────────
router.get('/areas',        checkPermission('admin', 'READ'),  listarAreas);
router.post('/areas',       checkPermission('admin', 'WRITE'), validate(crearAreaSchema),       crearArea);
router.patch('/areas/:id',  checkPermission('admin', 'WRITE'), validate(actualizarAreaSchema),  actualizarArea);
router.delete('/areas/:id', checkPermission('admin', 'WRITE'), eliminarArea);

// ── Usuarios ──────────────────────────────────────────────────────────────────
router.get('/usuarios',                     checkPermission('admin', 'READ'),  listarUsuarios);
router.patch('/usuarios/:id',               checkPermission('admin', 'WRITE'), validate(actualizarUsuarioSchema), actualizarUsuario);
router.patch('/usuarios/:id/rol',           checkPermission('admin', 'WRITE'), validate(cambiarRolSchema),        cambiarRol);
router.post('/usuarios/:id/reset-password', checkPermission('admin', 'WRITE'), validate(resetearPasswordSchema),  resetearPassword);

export default router;
