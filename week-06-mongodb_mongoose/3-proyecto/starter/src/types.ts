// ============================================
// TYPES — Contratos de respuesta genéricos
// ============================================
// Nota: `Course` y `Category` no se redefinen aquí — se usan los tipos que
// exportan sus propios modelos de Mongoose (`CourseDocument`, `CategoryDocument`).

export interface SingleResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
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
