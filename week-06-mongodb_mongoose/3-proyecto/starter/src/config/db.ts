// ============================================
// DB — Conexión a MongoDB (una sola vez, antes de levantar el servidor)
// ============================================
import mongoose from 'mongoose';
import { logger } from './logger';

export async function connectDB(): Promise<void> {
  const uri = process.env['MONGODB_URI'];
  if (!uri) {
    throw new Error('MONGODB_URI no está definida en el .env');
  }

  await mongoose.connect(uri);
  logger.info(`Conectado a MongoDB: ${mongoose.connection.name}`);
}
