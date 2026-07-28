// ============================================
// TIPOS — Dominio: Plataforma de Cursos Online
// ============================================

// Recurso principal del dominio: un curso del catálogo.
export interface Course {
  id: string;
  title: string;
  category: string;
  instructor: string;
  price: number;
  durationHours: number;
  active: boolean;
}

// Resumen que el procesador debe calcular
export interface CourseSummary {
  total: number;
  active: number;
  inactive: number;
  averagePrice: number;
  mostExpensive: Course;
  cheapest: Course;
  categories: string[];
}

// Reporte final que se escribirá en output/report.json
export interface Report {
  generatedAt: string;
  appliedFilter: string | null;
  summary: CourseSummary;
  courses: Course[];
}