// ============================================
// AUTH MIDDLEWARE — protege rutas con el access token de la cookie
// ============================================
import { Request, Response, NextFunction } from 'express';
import { ACCESS_COOKIE } from '../config/auth.config';
import { Role } from '../config/roles';
import { AppError } from '../errors/AppError';
import { verifyAccessToken } from '../services/token.service';

// Le agrega `req.user` al tipo Request de Express. El rol viaja dentro del JWT,
// así que no hace falta consultar la base de datos en cada petición.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; role: Role };
    }
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[ACCESS_COOKIE] as string | undefined;

  if (!token) {
    next(new AppError(401, 'No autenticado'));
    return;
  }

  try {
    // Verifica firma y expiración. Si el token está vencido o alterado, lanza
    // un AppError(401) que el errorHandler convierte en respuesta.
    const { sub, role } = verifyAccessToken(token);
    req.user = { id: sub, role };
    next();
  } catch (err) {
    next(err);
  }
}

// Para los controllers: devuelve req.user ya sin el "quizá undefined" de TypeScript.
export function getUser(req: Request): { id: string; role: Role } {
  if (!req.user) {
    throw new AppError(401, 'No autenticado');
  }
  return req.user;
}
