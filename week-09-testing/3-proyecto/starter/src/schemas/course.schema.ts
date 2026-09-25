// ============================================
// SCHEMAS — Validación de entrada con Zod (Course)
// ============================================
import { z } from 'zod';
import { objectIdSchema } from './objectId.schema';

// Campos base SIN valores por defecto.
const courseFields = z.object({
  title: z.string({ error: 'El título es obligatorio' }).trim().min(1, 'El título es obligatorio'),
  category: z.string({ error: 'La categoría es obligatoria' }).trim().min(1, 'La categoría es obligatoria'),
  instructor: z.string({ error: 'El instructor es obligatorio' }).trim().min(1, 'El instructor es obligatorio'),
  price: z.number({ error: 'El precio es obligatorio y debe ser un número' }).positive('El precio debe ser mayor a 0'),
  durationHours: z
    .number({ error: 'La duración es obligatoria y debe ser un número' })
    .int('La duración debe ser un número entero de horas')
    .positive('La duración debe ser mayor a 0'),
  active: z.boolean({ error: 'active debe ser true o false' }),
});

// Solo al CREAR, `active` vale true si no se envía.
export const createCourseSchema = courseFields.extend({
  active: z.boolean({ error: 'active debe ser true o false' }).default(true),
});

// Al ACTUALIZAR (PATCH) se parte de los campos base, sin defaults. Si se hiciera
// createCourseSchema.partial(), Zod 4 volvería a aplicar el default de `active`
// y un PATCH sin ese campo reactivaría un curso desactivado.
export const updateCourseSchema = courseFields
  .partial()
  .refine((data) => Object.keys(data).length > 0, { error: 'Envía al menos un campo para actualizar' });

export const courseIdSchema = objectIdSchema;

export type CreateCourseDto = z.infer<typeof createCourseSchema>;
export type UpdateCourseDto = z.infer<typeof updateCourseSchema>;
