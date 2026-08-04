// ============================================
// TYPES: Interfaz del recurso principal
// ============================================
// Dominio: Plataforma de cursos online
// Recurso: Course

export interface Course {
  id: number;
  title: string;
  category: string;
  instructor: string;
  price: number;
  durationHours: number;
  active: boolean;
}

// DTO usado para crear un nuevo curso (sin id, se genera automáticamente)
export type CreateCourseDto = Omit<Course, 'id'>;

// DTO para actualización (todos los campos editables, todos opcionales)
export type UpdateCourseDto = Partial<CreateCourseDto>;