// ============================================
// ROUTES — Category
// ============================================
import { Router } from 'express';
import * as controller from '../controllers/category.controller';

export const categoryRouter = Router();

categoryRouter.get('/', controller.getAll);
categoryRouter.get('/:id', controller.getById);
categoryRouter.post('/', controller.create);
categoryRouter.put('/:id', controller.update);
categoryRouter.delete('/:id', controller.remove);
