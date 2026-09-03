// ============================================
// APP ERROR — Errores HTTP del dominio
// ============================================

// Nombre legible por statusCode, para no repetir strings por todo el código
const STATUS_TEXT: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
};

export class AppError extends Error {
  public readonly statusCode: number;
  // Un error "operacional" es uno esperado (ej. recurso no existe) — no un bug.
  // Sirve para que en producción sepamos si el proceso puede seguir vivo o no.
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = STATUS_TEXT[statusCode] ?? 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true;

    // Necesario en TS al extender clases nativas como Error, para que
    // `instanceof AppError` funcione correctamente en el error handler.
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
