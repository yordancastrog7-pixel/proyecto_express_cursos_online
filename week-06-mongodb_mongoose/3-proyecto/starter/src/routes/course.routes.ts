// ============================================
// ROUTES — Course
// ============================================
import { Router } from 'express';
import * as controller from '../controllers/course.controller';

export const courseRouter = Router();

courseRouter.get('/', controller.getAll);
courseRouter.get('/:id', controller.getById);
courseRouter.post('/', controller.create);
courseRouter.put('/:id', controller.update);
courseRouter.delete('/:id', controller.remove);
