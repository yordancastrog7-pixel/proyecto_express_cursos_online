// ============================================
// APP — Configuración de Express
// ============================================
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import { authRouter } from './routes/auth.routes';
import { courseRouter } from './routes/course.routes';
import { userRouter } from './routes/user.routes';
import { notFound } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';
import { morganStream } from './config/logger';
import { corsMiddleware, globalLimiter, sanitizeInput } from './config/security';

const app = express();

// El orden importa: primero las defensas baratas (cabeceras, CORS, límite de
// peticiones), luego se lee el body, y solo después se llega a las rutas.
app.use(helmet()); // cabeceras de seguridad (X-Content-Type-Options: nosniff, CSP, HSTS, ...)
app.use(morgan('dev', { stream: morganStream }));
app.use(corsMiddleware);
app.use('/api', globalLimiter);
app.use(express.json());
app.use(sanitizeInput);
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', week: '08', project: 'api-segura-rbac' });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/courses', courseRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
