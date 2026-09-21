// ============================================
// SCHEMA COMPARTIDO — validación de formato ObjectId
// ============================================
import { z } from 'zod';

// Un ObjectId de Mongo siempre es un hexadecimal de 24 caracteres.
// Validar el formato aquí evita una consulta innecesaria a la base cuando
// el :id claramente está mal escrito (ej. "abc").
export const objectIdSchema = z
  .string({ error: 'El id es obligatorio' })
  .regex(/^[0-9a-fA-F]{24}$/, 'El id debe ser un ObjectId válido');
