// ============================================
// SERVER — Entry point
// ============================================
import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { logger } from './config/logger';

async function main(): Promise<void> {
  // La conexión a MongoDB se abre UNA vez, antes de levantar el servidor.
  await connectDB();

  app.listen(env.port, () => {
    logger.info(`Running on http://localhost:${env.port}`);
    logger.info(`Health: http://localhost:${env.port}/health`);
    logger.info(`Auth: http://localhost:${env.port}/api/v1/auth`);
    logger.info(`Courses (protegido): http://localhost:${env.port}/api/v1/courses`);
  });
}

main().catch((err) => {
  logger.error(`No se pudo iniciar el servidor: ${err.message}`);
  process.exit(1);
});
