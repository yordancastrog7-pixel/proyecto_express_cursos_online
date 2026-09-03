// ============================================
// SCHEMAS — Validación de entrada con Zod
// ============================================
import { z } from 'zod';

// Reglas de negocio del dominio: qué es un curso "válido"
export const createCourseSchema = z.object({
  title: z.string({ error: 'El título es obligatorio' }).trim().min(1, 'El título es obligatorio'),
  category: z.string({ error: 'La categoría es obligatoria' }).trim().min(1, 'La categoría es obligatoria'),
  instructor: z.string({ error: 'El instructor es obligatorio' }).trim().min(1, 'El instructor es obligatorio'),
  price: z.number({ error: 'El precio es obligatorio y debe ser un número' }).positive('El precio debe ser mayor a 0'),
  durationHours: z
    .number({ error: 'La duración es obligatoria y debe ser un número' })
    .int('La duración debe ser un número entero de horas')
    .positive('La duración debe ser mayor a 0'),
  active: z.boolean().default(true),
});

// Update reutiliza el schema de creación, solo que todos los campos son opcionales
export const updateCourseSchema = createCourseSchema.partial();

// Valida el :id que llega como string desde la URL y lo convierte a number
export const courseIdSchema = z.coerce
  .number({ message: 'El id debe ser un número' })
  .int('El id debe ser un número entero')
  .positive('El id debe ser positivo');

// Tipos inferidos directamente del schema — un solo lugar de verdad
export type CreateCourseDto = z.infer<typeof createCourseSchema>;
export type UpdateCourseDto = z.infer<typeof updateCourseSchema>;
