// ============================================
// DB — Conexión a MongoDB (una sola vez, antes de levantar el servidor)
// ============================================
import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

export async function connectDB(): Promise<void> {
  await mongoose.connect(env.mongodbUri);
  logger.info(`Conectado a MongoDB: ${mongoose.connection.name}`);
}
