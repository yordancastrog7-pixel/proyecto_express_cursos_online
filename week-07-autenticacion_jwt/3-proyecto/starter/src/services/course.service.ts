// ============================================
// SERVICE — Course
// ============================================
import { PaginatedResponse, PaginationParams } from '../types';
import { CreateCourseDto, UpdateCourseDto } from '../schemas/course.schema';
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

export async function create(dto: CreateCourseDto) {
  return repo.create(dto);
}

export async function update(id: string, dto: UpdateCourseDto) {
  return repo.update(id, dto);
}

export async function remove(id: string): Promise<void> {
  return repo.remove(id);
}
