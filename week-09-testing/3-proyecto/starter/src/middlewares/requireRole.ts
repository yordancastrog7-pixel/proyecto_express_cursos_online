// ============================================
// REQUIRE ROLE — autorización por rol (RBAC)
// ============================================
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { Role } from '../config/roles';

// Va SIEMPRE después de authMiddleware (que es quien llena req.user).
//   401 = no sé quién eres (sin sesión)
//   403 = sé quién eres, pero tu rol no alcanza
export function requireRole(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, 'No autenticado'));
      return;
    }

    if (!allowed.includes(req.user.role)) {
      next(new AppError(403, 'No tienes permiso para realizar esta acción'));
      return;
    }

    next();
  };
}
