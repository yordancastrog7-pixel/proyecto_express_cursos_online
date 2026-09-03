// ============================================
// CONTROLLER — Interfaz HTTP (extrae → llama service → responde)
// ============================================
import { Request, Response, NextFunction } from 'express';
import * as service from '../services/courses.service';
import { createCourseSchema, updateCourseSchema, courseIdSchema } from '../schemas/courses.schema';
import { zodErrorToResponse } from '../middlewares/errorHandler';

export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Number(req.query['page']) || 1;
    const limit = Number(req.query['limit']) || 10;

    const result = await service.findAll({ page, limit });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // .parse() aquí es seguro: está dentro del try/catch, así que un id inválido
    // (ej. "abc") lanza ZodError y next(err) lo manda al errorHandler → 400.
    const id = courseIdSchema.parse(req.params['id']);

    const course = await service.findById(id);
    res.json({ data: course });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // safeParse en vez de parse: queremos decidir nosotros el formato de la
    // respuesta 400 en vez de delegarlo al catch genérico.
    const result = createCourseSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json(zodErrorToResponse(result.error));
      return;
    }

    const course = await service.create(result.data);
    res.status(201).json({ data: course });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = courseIdSchema.parse(req.params['id']);

    const result = updateCourseSchema.safeParse(req.body);
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
    const id = courseIdSchema.parse(req.params['id']);
    await service.remove(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
