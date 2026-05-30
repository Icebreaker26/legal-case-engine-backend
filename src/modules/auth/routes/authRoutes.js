import { Router } from 'express';
import { login, register, logout } from '../../../controllers/authController.js';
import { validate } from '../../../middlewares/validateMiddleware.js';
import { registerSchema } from '../../../schemas/authSchema.js';

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
router.post('/login', login);

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

export default router;
