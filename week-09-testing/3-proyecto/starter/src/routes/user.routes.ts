// ============================================
// ROUTES — User (solo admin)
// ============================================
import { Router } from 'express';
import { listUsers } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/requireRole';
import { ROLES } from '../config/roles';

export const userRouter = Router();

userRouter.get('/', authMiddleware, requireRole(ROLES.ADMIN), listUsers);
