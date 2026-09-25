// ============================================
// TOKEN SERVICE — firmar, verificar y hashear tokens
// ============================================
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ACCESS_TOKEN_TTL_SEC, REFRESH_TOKEN_TTL_SEC } from '../config/auth.config';
import { AppError } from '../errors/AppError';
import { Role, isRole } from '../config/roles';

// El payload lleva el id del usuario (claim estándar `sub`) y su rol. Nada más:
// un JWT va firmado, NO cifrado — cualquiera puede leer lo que lleva adentro.
export function signAccessToken(userId: string, role: Role): string {
  return jwt.sign({ role }, env.jwtAccessSecret, {
    algorithm: 'HS256',
    subject: userId,
    expiresIn: ACCESS_TOKEN_TTL_SEC,
  });
}

// `jwtid` (un UUID al azar) hace que dos refresh tokens del mismo usuario emitidos
// en el mismo segundo sean distintos. Sin él, la rotación podría "renovar" a un
// token idéntico al anterior.
export function signRefreshToken(userId: string): string {
  return jwt.sign({}, env.jwtRefreshSecret, {
    algorithm: 'HS256',
    subject: userId,
    expiresIn: REFRESH_TOKEN_TTL_SEC,
    jwtid: crypto.randomUUID(),
  });
}

function verifyToken(token: string, secret: string): jwt.JwtPayload & { sub: string } {
  try {
    // jwt.verify comprueba la firma Y la expiración (exp). Se fija el algoritmo
    // para que nadie pueda mandar un token firmado con otro esquema.
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });

    if (typeof payload === 'string' || typeof payload.sub !== 'string') {
      throw new AppError(401, 'Token inválido');
    }

    return { ...payload, sub: payload.sub };
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err instanceof jwt.TokenExpiredError) throw new AppError(401, 'El token expiró');
    throw new AppError(401, 'Token inválido');
  }
}

export function verifyAccessToken(token: string): { sub: string; role: Role } {
  const payload = verifyToken(token, env.jwtAccessSecret);

  // Un token con firma válida pero sin un rol reconocido no sirve.
  if (!isRole(payload['role'])) {
    throw new AppError(401, 'Token inválido');
  }

  return { sub: payload.sub, role: payload['role'] };
}

export function verifyRefreshToken(token: string): { sub: string } {
  return { sub: verifyToken(token, env.jwtRefreshSecret).sub };
}

// Se guarda un SHA-256 del refresh token, no el token: si alguien lee la base de
// datos, no puede usar lo que ve. SHA-256 (y no bcrypt) porque el token ya es
// largo y aleatorio — no hay contraseña débil que proteger con un hash lento — y
// porque bcrypt solo mira los primeros 72 bytes, y todos los JWT de un mismo
// usuario empiezan casi igual.
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Comparación en tiempo constante (no revela cuántos caracteres coinciden).
export function tokenHashesMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}
