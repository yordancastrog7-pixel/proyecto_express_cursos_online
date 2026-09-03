// ============================================
// SERVICE — Lógica de negocio
// ============================================
import { Course, PaginatedResponse, PaginationParams } from '../types';
import { CreateCourseDto, UpdateCourseDto } from '../schemas/courses.schema';
import { AppError } from '../errors/AppError';
import * as repo from '../repositories/courses.repository';

export async function findAll(params: PaginationParams): Promise<PaginatedResponse<Course>> {
  const { page, limit } = params;
  const all = await repo.findAll();
  const start = (page - 1) * limit;
  const data = all.slice(start, start + limit);

  return { data, total: all.length, page, limit };
}

// Aquí vive la regla "si no existe, es un 404" — el controller ya no decide esto,
// solo deja que el AppError suba y lo capture el error handler.
export async function findById(id: number): Promise<Course> {
  const course = await repo.findById(id);
  if (!course) {
    throw new AppError(404, `Course ${id} not found`);
  }

  return course;
}

export async function create(dto: CreateCourseDto): Promise<Course> {
  return repo.create(dto);
}

export async function update(id: number, dto: UpdateCourseDto): Promise<Course> {
  await findById(id); // lanza AppError(404) si no existe — misma regla en un solo lugar
  const updated = await repo.update(id, dto);
  return updated!;
}

export async function remove(id: number): Promise<void> {
  await findById(id);
  await repo.remove(id);
}
