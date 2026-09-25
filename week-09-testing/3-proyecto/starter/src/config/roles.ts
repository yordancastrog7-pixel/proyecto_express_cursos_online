// ============================================
// ROLES — única fuente de verdad de los roles
// ============================================
// Los roles se escriben SOLO aquí. Modelos, middlewares, servicios y rutas
// importan esta constante: nunca se escribe 'admin' a mano en otro archivo.

export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_VALUES: Role[] = Object.values(ROLES);

// Confirma que un valor que viene "de afuera" (ej. el payload de un JWT) es un rol real.
export function isRole(value: unknown): value is Role {
  return ROLE_VALUES.some((role) => role === value);
}
