// ============================================
// PRISMA ERROR MAPPER — traduce códigos de Prisma a AppError
// ============================================
// Este es el único archivo (junto con el repository) que sabe que la app usa
// Prisma. El service y el controller solo conocen AppError.
import { Prisma } from '@prisma/client';
import { AppError } from './AppError';

export function mapPrismaError(err: unknown): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2025: la operación (update/delete/findUniqueOrThrow) esperaba un
    // registro que no existe.
    if (err.code === 'P2025') {
      throw new AppError(404, 'Curso no encontrado');
    }

    // P2002: se violó una restricción @unique (ej. título repetido).
    if (err.code === 'P2002') {
      const target = (err.meta?.['target'] as string[] | undefined)?.join(', ') ?? 'campo';
      throw new AppError(409, `Ya existe un curso con ese ${target}`);
    }
  }

  throw err;
}
