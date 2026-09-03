// ============================================
// SERVER — Entry point
// ============================================
import app from './app';
import { logger } from './config/logger';

const PORT = parseInt(process.env['PORT'] ?? '3000', 10);

app.listen(PORT, () => {
  logger.info(`Running on http://localhost:${PORT}`);
  logger.info(`Health: http://localhost:${PORT}/health`);
  logger.info(`API v1: http://localhost:${PORT}/api/v1/courses`);
});
