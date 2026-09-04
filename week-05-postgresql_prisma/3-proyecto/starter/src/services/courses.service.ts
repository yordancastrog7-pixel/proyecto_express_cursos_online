// ============================================
// SERVICE — Lógica de negocio
// ============================================
import type { Course } from '@prisma/client';
import { PaginatedResponse, PaginationParams } from '../types';
import { CreateCourseDto, UpdateCourseDto } from '../schemas/courses.schema';
import * as repo from '../repositories/courses.repository';

export async function findAll(params: PaginationParams): Promise<PaginatedResponse<Course>> {
  const { page, limit } = params;
  const skip = (page - 1) * limit;

  const { data, total } = await repo.findAll(skip, limit);
  return { data, total, page, limit };
}

// El 404 ya lo lanza el repository (P2025 de findUniqueOrThrow) — el service
// no necesita volver a preguntar "¿existe?".
export async function findById(id: string): Promise<Course> {
  return repo.findById(id);
}

export async function create(dto: CreateCourseDto): Promise<Course> {
  return repo.create(dto);
}

export async function update(id: string, dto: UpdateCourseDto): Promise<Course> {
  return repo.update(id, dto);
}

export async function remove(id: string): Promise<void> {
  return repo.remove(id);
}
