import express from 'express';
import type { Application, Request, Response, NextFunction } from 'express';
import { coursesRouter } from './routes/courses.routes.js';

export function createApp(): Application {
  const app = express();

  // 1. express.json() — parseo de body (requerido para POST/PUT)
  app.use(express.json());

  // 2. Logger personalizado — loggea método, URL, status y tiempo de respuesta
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });

    next();
  });

  // 3. Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // 4. Rutas del recurso principal
  app.use('/api/v1/courses', coursesRouter);

  // 5. Handler para rutas no encontradas (404)
  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // 6. Error handler global — SIEMPRE el último app.use()
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}