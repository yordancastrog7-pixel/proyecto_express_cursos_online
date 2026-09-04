// ============================================
// TYPES — Contratos de respuesta genéricos
// ============================================
// Nota: `Course` y `Lesson` NO se redefinen aquí — se usan los tipos que
// genera Prisma Client (`import type { Course } from '@prisma/client'`),
// para no mantener dos fuentes de verdad sobre la forma de los datos.

export interface SingleResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ErrorResponse {
  error: string;
  message: string;
}

export interface ValidationErrorResponse extends ErrorResponse {
  issues: { path: string; message: string }[];
}

export interface PaginationParams {
  page: number;
  limit: number;
}
