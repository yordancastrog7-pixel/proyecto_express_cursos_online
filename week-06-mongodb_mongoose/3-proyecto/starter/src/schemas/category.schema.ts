// ============================================
// SCHEMAS — Validación de entrada con Zod (Category)
// ============================================
import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string({ error: 'El nombre es obligatorio' }).trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().trim().max(200, 'La descripción es muy larga').optional(),
  active: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
