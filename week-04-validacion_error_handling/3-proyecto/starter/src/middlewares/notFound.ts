// ============================================
// NOT FOUND — captura rutas que no coinciden con ninguna
// ============================================
import { Request, Response } from 'express';
import { ErrorResponse } from '../types';

// Se registra DESPUÉS de todas las rutas: si una petición llega hasta aquí,
// es porque ninguna ruta de arriba coincidió.
export function notFound(req: Request, res: Response): void {
  const response: ErrorResponse = {
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  };
  res.status(404).json(response);
}
