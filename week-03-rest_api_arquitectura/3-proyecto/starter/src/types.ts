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

// DTO para crear — sin campos auto-generados (id, createdAt)
export type CreateCourseDto = Omit<Course, 'id' | 'createdAt'>;

// DTO para actualizar — todos los campos opcionales
export type UpdateCourseDto = Partial<CreateCourseDto>;

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

export interface PaginationParams {
  page: number;
  limit: number;
}