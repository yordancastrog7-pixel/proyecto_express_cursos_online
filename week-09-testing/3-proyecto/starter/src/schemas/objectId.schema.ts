// ============================================
// SCHEMA COMPARTIDO — validación de formato ObjectId
// ============================================
import { z } from 'zod';

export const objectIdSchema = z
  .string({ error: 'El id es obligatorio' })
  .regex(/^[0-9a-fA-F]{24}$/, 'El id debe ser un ObjectId válido');
