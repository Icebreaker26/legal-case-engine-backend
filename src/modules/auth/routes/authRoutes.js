import { Router } from 'express';
import { login, register, logout, changePassword } from '../controllers/authController.js';
import { authenticateToken } from '../../../middlewares/authMiddleware.js';
import { validate } from '../../../middlewares/validateMiddleware.js';
import { registerSchema, loginSchema } from '../schemas/authSchema.js';

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Éxito
 */
router.post('/login', validate(loginSchema), login);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Éxito
 */
router.post('/register', validate(registerSchema), register);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Éxito
 */
router.post('/logout', logout);

router.patch('/change-password', authenticateToken, changePassword);

export default router;
