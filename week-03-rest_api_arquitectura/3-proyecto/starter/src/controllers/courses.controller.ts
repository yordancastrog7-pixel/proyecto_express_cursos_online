// ============================================
// CONTROLLER — Interfaz HTTP
// ============================================
import { Request, Response, NextFunction } from 'express';
import * as service from '../services/courses.service';
import { CreateCourseDto, UpdateCourseDto, ErrorResponse } from '../types';

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
    const id = Number(req.params['id']);

    const course = await service.findById(id);

    if (!course) {
      const response: ErrorResponse = { error: 'Not Found', message: `Course ${id} not found` };
      res.status(404).json(response);
      return;
    }

    res.json({ data: course });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto: CreateCourseDto = req.body;

    const course = await service.create(dto);
    res.status(201).json({ data: course });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params['id']);
    const dto: UpdateCourseDto = req.body;

    const updated = await service.update(id, dto);

    if (!updated) {
      const response: ErrorResponse = { error: 'Not Found', message: `Course ${id} not found` };
      res.status(404).json(response);
      return;
    }

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params['id']);

    const wasDeleted = await service.remove(id);

    if (!wasDeleted) {
      const response: ErrorResponse = { error: 'Not Found', message: `Course ${id} not found` };
      res.status(404).json(response);
      return;
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}