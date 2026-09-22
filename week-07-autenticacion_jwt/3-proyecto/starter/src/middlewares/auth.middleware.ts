// ============================================
// AUTH MIDDLEWARE — protege rutas con el access token de la cookie
// ============================================
import { Request, Response, NextFunction } from 'express';
import { ACCESS_COOKIE } from '../config/auth.config';
import { AppError } from '../errors/AppError';
import { verifyAccessToken } from '../services/token.service';

// Le agrega `req.user` al tipo Request de Express, para poder leerlo (con tipos)
// en cualquier controller que venga después de este middleware.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string };
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
    const { sub } = verifyAccessToken(token);
    req.user = { id: sub };
    next();
  } catch (err) {
    next(err);
  }
}
