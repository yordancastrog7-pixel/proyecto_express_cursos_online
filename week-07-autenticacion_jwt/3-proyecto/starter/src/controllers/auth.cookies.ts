// ============================================
// COOKIES DE AUTH — cómo se envían y se borran los tokens
// ============================================
import { Response } from 'express';
import { env } from '../config/env';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  REFRESH_COOKIE_PATH,
  ACCESS_TOKEN_TTL_SEC,
  REFRESH_TOKEN_TTL_SEC,
} from '../config/auth.config';
import { TokenPair } from '../types';

const baseOptions = {
  httpOnly: true, // JavaScript del navegador NO puede leerla: un XSS no puede robar el token
  secure: env.isProduction, // en producción solo viaja por HTTPS
  sameSite: 'strict' as const, // no se envía en peticiones que vienen de otros sitios (frena CSRF)
};

export function setAuthCookies(res: Response, tokens: TokenPair): void {
  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...baseOptions,
    path: '/',
    maxAge: ACCESS_TOKEN_TTL_SEC * 1000, // la cookie vive lo mismo que el token
  });

  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...baseOptions,
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_TOKEN_TTL_SEC * 1000,
  });
}

// Para borrar una cookie hay que usar el mismo `path` con el que se creó.
export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { ...baseOptions, path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...baseOptions, path: REFRESH_COOKIE_PATH });
}
