// ============================================
// ROUTES — Mapeo de URLs a controllers
// ============================================
import { Router } from 'express';
import * as controller from '../controllers/courses.controller';

export const coursesRouter = Router();

coursesRouter.get('/', controller.getAll);
coursesRouter.get('/:id', controller.getById);
coursesRouter.post('/', controller.create);
coursesRouter.put('/:id', controller.update);
coursesRouter.delete('/:id', controller.remove);