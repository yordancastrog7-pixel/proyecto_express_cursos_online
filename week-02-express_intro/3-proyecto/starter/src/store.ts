import type { Course, CreateCourseDto, UpdateCourseDto } from './types.js';

// Store en memoria — simula una base de datos sin persistencia
// Los datos se pierden al reiniciar el servidor (se usará BD a partir de week-05)
const courses: Course[] = [];
let nextId = 1;

// Retorna todos los cursos del catálogo
export function getAll(): Course[] {
  return courses;
}

// Busca un curso por id. Retorna undefined si no existe.
export function getById(id: number): Course | undefined {
  return courses.find((course) => course.id === id);
}

// Crea un nuevo curso con id autoincremental y lo agrega al catálogo
export function create(data: CreateCourseDto): Course {
  const newCourse: Course = { id: nextId++, ...data };
  courses.push(newCourse);
  return newCourse;
}

// Actualiza un curso existente. Retorna undefined si no existe.
export function update(id: number, data: UpdateCourseDto): Course | undefined {
  const course = courses.find((c) => c.id === id);
  if (!course) {
    return undefined;
  }

  Object.assign(course, data);
  return course;
}

// Elimina un curso por id. Retorna true si lo eliminó, false si no existía.
export function remove(id: number): boolean {
  const index = courses.findIndex((course) => course.id === id);
  if (index === -1) {
    return false;
  }

  courses.splice(index, 1);
  return true;
}