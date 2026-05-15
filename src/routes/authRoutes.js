import { Router } from 'express';
import { login, register, logout } from '../controllers/authController.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { registerSchema } from '../schemas/authSchema.js';

const router = Router();

router.post('/login', login);
router.post('/register', validate(registerSchema), register);
router.post('/logout', logout);

export default router;
