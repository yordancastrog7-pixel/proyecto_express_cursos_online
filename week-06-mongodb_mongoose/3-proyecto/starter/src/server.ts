// ============================================
// SERVER — Entry point
// ============================================
import app from './app';
import { connectDB } from './config/db';
import { logger } from './config/logger';

const PORT = parseInt(process.env['PORT'] ?? '3000', 10);

async function main(): Promise<void> {
  // La conexión a MongoDB se abre UNA vez, antes de levantar el servidor —
  // nunca dentro de una ruta o de un repository (rompería con cada petición).
  await connectDB();

  app.listen(PORT, () => {
    logger.info(`Running on http://localhost:${PORT}`);
    logger.info(`Health: http://localhost:${PORT}/health`);
    logger.info(`API v1: http://localhost:${PORT}/api/v1/courses`);
  });
}

main().catch((err) => {
  logger.error(`No se pudo iniciar el servidor: ${err.message}`);
  process.exit(1);
});
