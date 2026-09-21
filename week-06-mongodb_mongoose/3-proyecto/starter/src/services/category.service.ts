// ============================================
// SERVICE — Category
// ============================================
import { CreateCategoryDto, UpdateCategoryDto } from '../schemas/category.schema';
import * as repo from '../repositories/category.repository';

export async function findAll() {
  return repo.findAll();
}

export async function findById(id: string) {
  return repo.findById(id);
}

export async function create(dto: CreateCategoryDto) {
  return repo.create(dto);
}

export async function update(id: string, dto: UpdateCategoryDto) {
  return repo.update(id, dto);
}

export async function remove(id: string): Promise<void> {
  return repo.remove(id);
}
