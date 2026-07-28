// ============================================
// PROCESSOR — Filtra y calcula estadísticas
// ============================================
import type { Course, CourseSummary } from './types.js';

export function filterByCategory(courses: Course[], categoryFilter: string | null): Course[] {
  if (categoryFilter === null) {
    return courses;
  }

  const normalizedFilter = categoryFilter.toLowerCase();
  const filtered = courses.filter((course) => course.category.toLowerCase() === normalizedFilter);

  if (filtered.length === 0) {
    const availableCategories = Array.from(new Set(courses.map((c) => c.category))).join(', ');
    throw new Error(
      `No se encontraron cursos en la categoría "${categoryFilter}". Categorías disponibles: ${availableCategories}`
    );
  }

  return filtered;
}

export function calculateSummary(courses: Course[]): CourseSummary {
  if (courses.length === 0) {
    throw new Error('No hay cursos para calcular el resumen.');
  }

  const total = courses.length;
  const active = courses.filter((c) => c.active === true).length;
  const inactive = courses.filter((c) => c.active === false).length;

  const totalPrice = courses.reduce((sum, c) => sum + c.price, 0);
  const averagePrice = Math.round((totalPrice / total) * 100) / 100;

  const mostExpensive = courses.reduce((max, c) => (c.price > max.price ? c : max), courses[0]);
  const cheapest = courses.reduce((min, c) => (c.price < min.price ? c : min), courses[0]);

  const categories = Array.from(new Set(courses.map((c) => c.category)));

  return {
    total,
    active,
    inactive,
    averagePrice,
    mostExpensive,
    cheapest,
    categories,
  };
}