// ============================================
// APP — Configuración de Express
// ============================================
import express from 'express';
import morgan from 'morgan';
import { courseRouter } from './routes/course.routes';
import { categoryRouter } from './routes/category.routes';
import { notFound } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';
import { morganStream } from './config/logger';

const app = express();

app.use(express.json());
app.use(morgan('dev', { stream: morganStream }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', week: '06', project: 'mongodb-mongoose' });
});

app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/courses', courseRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
