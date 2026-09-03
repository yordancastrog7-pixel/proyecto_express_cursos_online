// ============================================
// APP — Configuración de Express
// ============================================
import express from 'express';
import morgan from 'morgan';
import { coursesRouter } from './routes/courses.routes';
import { notFound } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';
import { morganStream } from './config/logger';

const app = express();

app.use(express.json());
app.use(morgan('dev', { stream: morganStream }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', week: '04', project: 'validacion-errores-logging' });
});

app.use('/api/v1/courses', coursesRouter);

// Orden importa: primero todas las rutas, luego el 404, y al final el error handler.
app.use(notFound);
app.use(errorHandler);

export default app;
