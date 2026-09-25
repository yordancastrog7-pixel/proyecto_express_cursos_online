// ============================================
// ROUTES — Auth
// ============================================
import { Router } from 'express';
import * as controller from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { createAuthLimiter } from '../config/security';

export const authRouter = Router();

// Públicas. Registro y login llevan un límite MUY estricto (5 cada 15 min por IP):
// son el blanco de la fuerza bruta y del spam de cuentas. Cada ruta tiene su propio
// contador (una instancia del limitador por ruta).
authRouter.post('/register', createAuthLimiter(), controller.register);
authRouter.post('/login', createAuthLimiter(), controller.login);
authRouter.post('/refresh', controller.refresh);
authRouter.post('/logout', controller.logout);

// Protegida
authRouter.get('/me', authMiddleware, controller.me);
