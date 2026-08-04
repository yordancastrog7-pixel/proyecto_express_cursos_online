import { Router } from 'express';
import * as store from '../store.js';
import type { CreateCourseDto, UpdateCourseDto } from '../types.js';

export const coursesRouter = Router();

// GET /courses — Listar todos los cursos
// Status: 200
coursesRouter.get('/', (_req, res) => {
  const courses = store.getAll();
  res.status(200).json(courses);
});

// GET /courses/:id — Obtener curso por ID
// Status: 200 si existe | 404 si no existe
coursesRouter.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const course = store.getById(id);

  if (!course) {
    res.status(404).json({ error: `Curso con id ${id} no encontrado` });
    return;
  }

  res.status(200).json(course);
});

// POST /courses — Crear nuevo curso
// Status: 201 con el recurso creado
coursesRouter.post('/', (req, res) => {
  const dto: CreateCourseDto = req.body;
  const newCourse = store.create(dto);
  res.status(201).json(newCourse);
});

// PUT /courses/:id — Actualizar curso completo
// Status: 200 con el recurso actualizado | 404 si no existe
coursesRouter.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const dto: UpdateCourseDto = req.body;
  const updatedCourse = store.update(id, dto);

  if (!updatedCourse) {
    res.status(404).json({ error: `Curso con id ${id} no encontrado` });
    return;
  }

  res.status(200).json(updatedCourse);
});

// DELETE /courses/:id — Eliminar curso
// Status: 204 sin body | 404 si no existe
coursesRouter.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const wasDeleted = store.remove(id);

  if (!wasDeleted) {
    res.status(404).json({ error: `Curso con id ${id} no encontrado` });
    return;
  }

  res.status(204).send();
});