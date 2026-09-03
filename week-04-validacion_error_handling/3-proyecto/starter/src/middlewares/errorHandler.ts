// ============================================
// ERROR HANDLER — middleware global de errores
// ============================================
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';
import { logger } from '../config/logger';
import { ErrorResponse, ValidationErrorResponse } from '../types';

// Convierte un ZodError en el mismo formato que usamos en toda la API.
// La reutilizan tanto el errorHandler (para el :id inválido) como los
// controllers (cuando el body no pasa el safeParse).
export function zodErrorToResponse(error: ZodError): ValidationErrorResponse {
  return {
    error: 'Validation Error',
    message: 'Los datos enviados no son válidos',
    issues: error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
  };
}

// Middleware de 4 parámetros — Express solo lo reconoce como error handler
// si tiene exactamente esta firma, aunque `_next` no se use.
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json(zodErrorToResponse(err));
    return;
  }

  if (err instanceof AppError) {
    logger.warn(`${req.method} ${req.originalUrl} -> ${err.statusCode} ${err.message}`);
    const response: ErrorResponse = { error: err.name, message: err.message };
    res.status(err.statusCode).json(response);
    return;
  }

  // Cualquier otra cosa es un bug no anticipado — se registra como error y
  // el stack solo se expone fuera de producción, para no filtrar detalles internos.
  logger.error(`${req.method} ${req.originalUrl} -> 500 ${err.message}`);
  const response: ErrorResponse & { stack?: string } = {
    error: 'Internal Server Error',
    message: err.message,
  };

  if (process.env['NODE_ENV'] !== 'production') {
    response.stack = err.stack;
  }

  res.status(500).json(response);
}
