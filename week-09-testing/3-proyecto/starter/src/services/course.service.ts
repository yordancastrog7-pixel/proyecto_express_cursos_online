// ============================================
// SERVICE — Course
// ============================================
import { PaginatedResponse, PaginationParams } from '../types';
import { CreateCourseDto, UpdateCourseDto } from '../schemas/course.schema';
import { ROLES, Role } from '../config/roles';
import { AppError } from '../errors/AppError';
import * as repo from '../repositories/course.repository';

export async function findAll(params: PaginationParams): Promise<PaginatedResponse<unknown>> {
  const { page, limit } = params;
  const skip = (page - 1) * limit;

  const { data, total } = await repo.findAll(skip, limit);
  return { data, total, page, totalPages: Math.ceil(total / limit) };
}

export async function findById(id: string) {
  return repo.findById(id);
}

export async function create(dto: CreateCourseDto, userId: string) {
  return repo.create(dto, userId);
}

// Regla de propiedad: solo el creador del curso o un admin puede modificarlo.
// Vive en el service (no en el controller) porque es una regla de negocio.
export async function update(id: string, dto: UpdateCourseDto, actor: { id: string; role: Role }) {
  const course = await repo.findById(id); // lanza 404 si no existe
  const isOwner = course.createdBy.toString() === actor.id;

  if (!isOwner && actor.role !== ROLES.ADMIN) {
    throw new AppError(403, 'Solo el creador del curso o un admin puede modificarlo');
  }

  return repo.update(id, dto);
}

export async function remove(id: string): Promise<void> {
  return repo.remove(id);
}
