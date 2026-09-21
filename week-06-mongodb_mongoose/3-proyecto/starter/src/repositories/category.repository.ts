// ============================================
// REPOSITORY — Category (acceso a datos con Mongoose)
// ============================================
import { Category } from '../models/category.model';
import { CreateCategoryDto, UpdateCategoryDto } from '../schemas/category.schema';
import { AppError } from '../errors/AppError';
import { mapMongooseError } from '../errors/mongooseError';

export async function findAll() {
  return Category.find().sort({ name: 1 }).lean();
}

export async function findById(id: string) {
  try {
    const category = await Category.findById(id).lean();
    if (!category) {
      throw new AppError(404, 'Categoría no encontrada');
    }
    return category;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapMongooseError(err);
  }
}

export async function create(dto: CreateCategoryDto) {
  try {
    const created = await Category.create(dto);
    return created.toObject();
  } catch (err) {
    mapMongooseError(err);
  }
}

export async function update(id: string, dto: UpdateCategoryDto) {
  try {
    const updated = await Category.findByIdAndUpdate(id, dto, {
      returnDocument: 'after',
      runValidators: true,
    }).lean();
    if (!updated) {
      throw new AppError(404, 'Categoría no encontrada');
    }
    return updated;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapMongooseError(err);
  }
}

export async function remove(id: string): Promise<void> {
  try {
    const deleted = await Category.findByIdAndDelete(id).lean();
    if (!deleted) {
      throw new AppError(404, 'Categoría no encontrada');
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapMongooseError(err);
  }
}
