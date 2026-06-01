import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/authMiddleware.js';
import { listarPermisosUsuario, asignarPermiso, asignarPermisosMasivo, revocarPermiso } from '../controllers/permisosController.js';

const router = Router();

router.use(authenticateToken);

// Endpoints para gestionar permisos
/**
 * @swagger
 * /api/permisos/usuario/{usuario_id}:
 *   get:
 *     summary: Listar permisos de un usuario
 *     tags: [Permisos]
 *     parameters:
 *       - in: path
 *         name: usuario_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Éxito
 */
router.get('/usuario/:usuario_id', listarPermisosUsuario);

/**
 * @swagger
 * /api/permisos/asignar:
 *   post:
 *     summary: Asignar permiso
 *     tags: [Permisos]
 *     responses:
 *       200:
 *         description: Éxito
 */
router.post('/asignar', asignarPermiso);
router.post('/asignar-masivo', asignarPermisosMasivo);

/**
 * @swagger
 * /api/permisos/revocar:
 *   delete:
 *     summary: Revocar permiso
 *     tags: [Permisos]
 *     responses:
 *       200:
 *         description: Éxito
 */
router.delete('/revocar', revocarPermiso);

export default router;
