// ============================================
// SCHEMAS — Validación de entrada con Zod (auth)
// ============================================
import { z } from 'zod';

// Se limpia (trim + minúsculas) ANTES de validar el formato del email, para que
// "  Ana@Correo.COM " y "ana@correo.com" sean el mismo usuario.
const emailSchema = z
  .string({ error: 'El email es obligatorio' })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'El email no es válido' }));

export const registerSchema = z.object({
  name: z.string({ error: 'El nombre es obligatorio' }).trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(60),
  email: emailSchema,
  // bcrypt solo usa los primeros 72 bytes: más largo que eso no aporta seguridad.
  password: z
    .string({ error: 'La contraseña es obligatoria' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'La contraseña no puede pasar de 72 caracteres')
    .regex(/[A-Za-z]/, 'La contraseña debe incluir al menos una letra')
    .regex(/\d/, 'La contraseña debe incluir al menos un número'),
});

// En el login NO se revisa la fuerza de la contraseña: solo que venga.
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ error: 'La contraseña es obligatoria' }).min(1, 'La contraseña es obligatoria'),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
