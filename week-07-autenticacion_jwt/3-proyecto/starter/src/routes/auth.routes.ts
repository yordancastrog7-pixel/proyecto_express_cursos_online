// ============================================
// ROUTES — Auth
// ============================================
import { Router } from 'express';
import * as controller from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export const authRouter = Router();

// Públicas
authRouter.post('/register', controller.register);
authRouter.post('/login', controller.login);
authRouter.post('/refresh', controller.refresh);
authRouter.post('/logout', controller.logout);

// Protegida
authRouter.get('/me', authMiddleware, controller.me);
