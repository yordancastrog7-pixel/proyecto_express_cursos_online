// ============================================
// PRISMA CLIENT — Singleton
// ============================================
import { PrismaClient } from '@prisma/client';

// `tsx watch` reinicia el módulo en cada cambio de archivo durante desarrollo.
// Sin este singleton, cada reinicio crearía una conexión nueva a Postgres sin
// cerrar la anterior, agotando el pool de conexiones en pocos minutos.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}
