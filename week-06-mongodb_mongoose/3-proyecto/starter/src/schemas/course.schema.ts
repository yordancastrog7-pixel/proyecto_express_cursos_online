// ============================================
// SCHEMAS — Validación de entrada con Zod (Course)
// ============================================
import { z } from 'zod';
import { objectIdSchema } from './objectId.schema';

export const createCourseSchema = z.object({
  title: z.string({ error: 'El título es obligatorio' }).trim().min(1, 'El título es obligatorio'),
  // Aquí solo se valida la FORMA del id (24 hex) — que la categoría exista
  // de verdad lo confirma el service antes de guardar el curso.
  category: objectIdSchema,
  instructor: z.string({ error: 'El instructor es obligatorio' }).trim().min(1, 'El instructor es obligatorio'),
  price: z.number({ error: 'El precio es obligatorio y debe ser un número' }).positive('El precio debe ser mayor a 0'),
  durationHours: z
    .number({ error: 'La duración es obligatoria y debe ser un número' })
    .int('La duración debe ser un número entero de horas')
    .positive('La duración debe ser mayor a 0'),
  active: z.boolean().default(true),
});

export const updateCourseSchema = createCourseSchema.partial();

export const courseIdSchema = objectIdSchema;

export type CreateCourseDto = z.infer<typeof createCourseSchema>;
export type UpdateCourseDto = z.infer<typeof updateCourseSchema>;
