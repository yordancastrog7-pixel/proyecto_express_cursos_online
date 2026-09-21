// ============================================
// CONTROLLER — Category
// ============================================
import { Request, Response, NextFunction } from 'express';
import * as service from '../services/category.service';
import { createCategorySchema, updateCategorySchema } from '../schemas/category.schema';
import { objectIdSchema } from '../schemas/objectId.schema';
import { zodErrorToResponse } from '../middlewares/errorHandler';

export async function getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await service.findAll();
    res.json({ data: categories });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = objectIdSchema.parse(req.params['id']);
    const category = await service.findById(id);
    res.json({ data: category });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = createCategorySchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json(zodErrorToResponse(result.error));
      return;
    }

    const category = await service.create(result.data);
    res.status(201).json({ data: category });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = objectIdSchema.parse(req.params['id']);

    const result = updateCategorySchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json(zodErrorToResponse(result.error));
      return;
    }

    const updated = await service.update(id, result.data);
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = objectIdSchema.parse(req.params['id']);
    await service.remove(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
