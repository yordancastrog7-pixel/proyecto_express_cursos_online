// ============================================
// ROUTES — Course (todas protegidas)
// ============================================
import { Router } from 'express';
import * as controller from '../controllers/course.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export const courseRouter = Router();

// Una sola línea protege TODAS las rutas de abajo: sin access token válido, ninguna responde.
courseRouter.use(authMiddleware);

courseRouter.get('/', controller.getAll);
courseRouter.get('/:id', controller.getById);
courseRouter.post('/', controller.create);
courseRouter.patch('/:id', controller.update);
courseRouter.delete('/:id', controller.remove);
