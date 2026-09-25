// ============================================
// ENV — Variables de entorno validadas al arrancar
// ============================================
// Ningún secreto vive en el código: todo sale del .env. Si falta algo, la app
// se niega a arrancar con un mensaje claro, en vez de fallar a medias después.

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}. Revisa tu archivo .env (usa .env.example como guía).`);
  }
  return value;
}

function requireSecret(name: string): string {
  const secret = required(name);

  if (secret.length < 32) {
    throw new Error(`${name} es muy corto: debe tener al menos 32 caracteres.`);
  }
  if (secret.startsWith('cambia-esto')) {
    throw new Error(`${name} todavía tiene el valor de ejemplo de .env.example: genera un secreto real.`);
  }

  return secret;
}

const jwtAccessSecret = requireSecret('JWT_ACCESS_SECRET');
const jwtRefreshSecret = requireSecret('JWT_REFRESH_SECRET');

// Si ambos tokens usaran el mismo secreto, un refresh token robado podría
// hacerse pasar por un access token (y al revés).
if (jwtAccessSecret === jwtRefreshSecret) {
  throw new Error('JWT_ACCESS_SECRET y JWT_REFRESH_SECRET deben ser DISTINTOS.');
}

const corsOrigins = required('CORS_ORIGINS')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// "*" dejaría que CUALQUIER sitio web llame a la API con la sesión del usuario.
if (corsOrigins.includes('*')) {
  throw new Error('CORS_ORIGINS no puede incluir "*": lista los orígenes permitidos uno por uno.');
}

export const env = {
  isProduction: process.env['NODE_ENV'] === 'production',
  port: parseInt(process.env['PORT'] ?? '3000', 10),
  mongodbUri: required('MONGODB_URI'),
  corsOrigins,
  jwtAccessSecret,
  jwtRefreshSecret,
};
