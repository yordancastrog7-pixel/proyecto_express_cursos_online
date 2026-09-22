// ============================================
// APP — Configuración de Express
// ============================================
import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { authRouter } from './routes/auth.routes';
import { courseRouter } from './routes/course.routes';
import { notFound } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';
import { morganStream } from './config/logger';

const app = express();

app.use(express.json());
app.use(cookieParser()); // llena req.cookies: sin esto, el middleware de auth no vería el token
app.use(morgan('dev', { stream: morganStream }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', week: '07', project: 'autenticacion-jwt' });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/courses', courseRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
