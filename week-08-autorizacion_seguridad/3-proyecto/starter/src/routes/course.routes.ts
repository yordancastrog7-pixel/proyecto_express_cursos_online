// ============================================
// ROUTES — Course (RBAC)
// ============================================
import { Router } from 'express';
import * as controller from '../controllers/course.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/requireRole';
import { ROLES } from '../config/roles';

export const courseRouter = Router();

// Lectura: pública (el catálogo se puede ver sin cuenta).
courseRouter.get('/', controller.getAll);
courseRouter.get('/:id', controller.getById);

// Crear: cualquier usuario con sesión.
courseRouter.post('/', authMiddleware, controller.create);

// Modificar: con sesión; además el service exige ser el creador del curso o admin.
courseRouter.patch('/:id', authMiddleware, controller.update);

// Eliminar: solo admin.
courseRouter.delete('/:id', authMiddleware, requireRole(ROLES.ADMIN), controller.remove);
