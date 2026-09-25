// ============================================
// AUTH CONFIG — Constantes de seguridad en un solo lugar
// ============================================

// Costo de bcrypt: cada +1 duplica el tiempo de cálculo del hash.
export const SALT_ROUNDS = 10;

// Un solo valor por token: sirve para firmar el JWT Y para la vida de la cookie,
// así nunca quedan desalineados (cookie viva con token ya vencido, o al revés).
export const ACCESS_TOKEN_TTL_SEC = 15 * 60; // 15 minutos
export const REFRESH_TOKEN_TTL_SEC = 7 * 24 * 60 * 60; // 7 días

export const ACCESS_COOKIE = 'accessToken';
export const REFRESH_COOKIE = 'refreshToken';

// El refresh token solo viaja hacia las rutas de auth, no en cada petición.
export const REFRESH_COOKIE_PATH = '/api/v1/auth';
