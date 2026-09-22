// ============================================
// REPOSITORY — Course (acceso a datos con Mongoose)
// ============================================
import { Course } from '../models/course.model';
import { CreateCourseDto, UpdateCourseDto } from '../schemas/course.schema';
import { AppError } from '../errors/AppError';
import { mapMongooseError } from '../errors/mongooseError';

export async function findAll(skip: number, limit: number) {
  const [data, total] = await Promise.all([
    Course.find().sort({ createdAt: 1 }).skip(skip).limit(limit).lean(),
    Course.countDocuments(),
  ]);

  return { data, total };
}

export async function findById(id: string) {
  try {
    const course = await Course.findById(id).lean();
    if (!course) {
      throw new AppError(404, 'Curso no encontrado');
    }
    return course;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapMongooseError(err);
  }
}

export async function create(dto: CreateCourseDto) {
  try {
    const created = await Course.create(dto);
    return created.toObject();
  } catch (err) {
    mapMongooseError(err);
  }
}

export async function update(id: string, dto: UpdateCourseDto) {
  try {
    const updated = await Course.findByIdAndUpdate(id, dto, { returnDocument: 'after', runValidators: true }).lean();
    if (!updated) {
      throw new AppError(404, 'Curso no encontrado');
    }
    return updated;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapMongooseError(err);
  }
}

export async function remove(id: string): Promise<void> {
  try {
    const deleted = await Course.findByIdAndDelete(id).lean();
    if (!deleted) {
      throw new AppError(404, 'Curso no encontrado');
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapMongooseError(err);
  }
}
