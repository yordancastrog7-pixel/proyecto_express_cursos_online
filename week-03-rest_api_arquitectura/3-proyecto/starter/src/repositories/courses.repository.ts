// ============================================
// REPOSITORY — Capa de acceso a datos
// ============================================
import { Course, CreateCourseDto, UpdateCourseDto } from '../types';

const store: Course[] = [
  { id: 1, title: 'Node.js desde Cero', category: 'backend', instructor: 'Ana Torres', price: 49.99, durationHours: 12, active: true, createdAt: new Date().toISOString() },
  { id: 2, title: 'React Avanzado', category: 'frontend', instructor: 'Carlos Ruiz', price: 59.99, durationHours: 18, active: true, createdAt: new Date().toISOString() },
  { id: 3, title: 'Bases de Datos SQL', category: 'data', instructor: 'María Gómez', price: 39.99, durationHours: 10, active: true, createdAt: new Date().toISOString() },
  { id: 4, title: 'Diseño UX/UI', category: 'design', instructor: 'Laura Pérez', price: 34.99, durationHours: 8, active: false, createdAt: new Date().toISOString() },
];

let nextId = 5;

export async function findAll(): Promise<Course[]> {
  return [...store];
}

export async function findById(id: number): Promise<Course | undefined> {
  const course = store.find((c) => c.id === id);
  return course ? { ...course } : undefined;
}

export async function create(dto: CreateCourseDto): Promise<Course> {
  const course: Course = { id: nextId++, ...dto, createdAt: new Date().toISOString() };
  store.push(course);
  return { ...course };
}

export async function update(id: number, dto: UpdateCourseDto): Promise<Course | undefined> {
  const index = store.findIndex((c) => c.id === id);
  if (index === -1) {
    return undefined;
  }

  store[index] = { ...store[index]!, ...dto };
  return { ...store[index]! };
}

export async function remove(id: number): Promise<boolean> {
  const index = store.findIndex((c) => c.id === id);
  if (index === -1) {
    return false;
  }

  store.splice(index, 1);
  return true;
}