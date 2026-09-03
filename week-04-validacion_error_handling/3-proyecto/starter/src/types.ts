// ============================================
// TYPES — Dominio: Plataforma de Cursos Online
// ============================================

export interface Course {
  id: number;
  title: string;
  category: string;
  instructor: string;
  price: number;
  durationHours: number;
  active: boolean;
  createdAt: string;
}

// Contratos de respuesta (genéricos, no cambiar nombres)
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

// Respuesta de error de validación — issue por cada campo que falló
export interface ValidationErrorResponse extends ErrorResponse {
  issues: { path: string; message: string }[];
}

export interface PaginationParams {
  page: number;
  limit: number;
}
