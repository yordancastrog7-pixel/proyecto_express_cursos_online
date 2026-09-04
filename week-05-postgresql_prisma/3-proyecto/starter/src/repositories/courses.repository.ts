// ============================================
// REPOSITORY — Capa de acceso a datos (Prisma Client)
// ============================================
import { prisma } from '../lib/prisma';
import { CreateCourseDto, UpdateCourseDto } from '../schemas/courses.schema';
import { mapPrismaError } from '../errors/prismaError';

export async function findAll(skip: number, take: number) {
  const [data, total] = await Promise.all([
    prisma.course.findMany({ skip, take, orderBy: { createdAt: 'asc' } }),
    prisma.course.count(),
  ]);

  return { data, total };
}

export async function findById(id: string) {
  try {
    // findUniqueOrThrow lanza P2025 automáticamente si no existe — así el
    // "no encontrado" y el "traer con su relación" quedan en una sola query.
    return await prisma.course.findUniqueOrThrow({
      where: { id },
      include: { lessons: { orderBy: { order: 'asc' } } },
    });
  } catch (err) {
    mapPrismaError(err);
  }
}

export async function create(dto: CreateCourseDto) {
  try {
    return await prisma.course.create({ data: dto });
  } catch (err) {
    mapPrismaError(err);
  }
}

export async function update(id: string, dto: UpdateCourseDto) {
  try {
    return await prisma.course.update({ where: { id }, data: dto });
  } catch (err) {
    mapPrismaError(err);
  }
}

export async function remove(id: string): Promise<void> {
  try {
    // onDelete: Cascade en el schema borra también las lecciones del curso.
    await prisma.course.delete({ where: { id } });
  } catch (err) {
    mapPrismaError(err);
  }
}
