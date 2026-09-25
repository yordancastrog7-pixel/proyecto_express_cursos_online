// ============================================
// SECURITY — CORS, rate limiting y sanitización
// ============================================
// (Helmet se aplica directo en app.ts: `app.use(helmet())` ya trae buenos valores.)
import cors from 'cors';
import { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { env } from './env';
import { AppError } from '../errors/AppError';

// ---- CORS con lista blanca -------------------------------------------------
// CORS decide qué páginas web (orígenes) pueden llamar a esta API desde un
// navegador. NUNCA se usa `*`: cualquier sitio podría hacer peticiones en nombre
// de un usuario con sesión. Los orígenes permitidos salen de CORS_ORIGINS (.env).
export const corsMiddleware = cors({
  origin(origin, callback) {
    // Sin cabecera Origin no es un navegador (curl, Thunder Client, otro servidor):
    // CORS no aplica, la protección de esas peticiones es la autenticación.
    if (!origin || env.corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new AppError(403, 'Origen no permitido por CORS'));
  },
  credentials: true, // permite que el navegador envíe y reciba las cookies de sesión
});

// ---- Rate limiting ---------------------------------------------------------
// Cuenta peticiones por IP en una ventana de 15 minutos. Al pasarse responde 429.
// ponytail: contador en memoria del proceso; con varias instancias del servidor
// haría falta un store compartido (Redis).
function limiter(limit: number, message: string) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: true, // RateLimit-Limit / RateLimit-Remaining / RateLimit-Reset
    legacyHeaders: true, // X-RateLimit-Limit / X-RateLimit-Remaining
    message: { error: 'Too Many Requests', message },
  });
}

// Límite general para toda la API.
export const globalLimiter = limiter(100, 'Demasiadas peticiones. Intenta de nuevo en 15 minutos.');

// Límite estricto para autenticación. Es una función para que cada ruta que lo
// use tenga su PROPIO contador.
export const createAuthLimiter = () =>
  limiter(5, 'Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos.');

// ---- Sanitización contra NoSQL injection ------------------------------------
// Un atacante puede mandar {"email": {"$gt": ""}} para que Mongo compare "mayor
// que vacío" (verdadero para todo) en lugar de un texto. `sanitize` borra las
// claves que empiezan con `$` o contienen `.`.
// Se usa la función `sanitize` y no el middleware de la librería: éste intenta
// reasignar `req.query`, que en Express 5 es de solo lectura. Con el parser de
// query por defecto de Express 5 tampoco se pueden armar objetos anidados desde
// la URL, así que el body es la única vía de entrada de operadores.
export const sanitizeInput: RequestHandler = (req, _res, next) => {
  mongoSanitize.sanitize(req.body);
  next();
};
