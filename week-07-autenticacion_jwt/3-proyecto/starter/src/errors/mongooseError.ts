// ============================================
// MONGOOSE ERROR MAPPER — traduce errores de Mongo/Mongoose a AppError
// ============================================
import { Error as MongooseError, mongo } from 'mongoose';
import { AppError } from './AppError';

export function mapMongooseError(err: unknown): never {
  // CastError: el :id no tiene forma de ObjectId
  if (err instanceof MongooseError.CastError) {
    throw new AppError(400, `El id "${String(err.value)}" no es un ObjectId válido`);
  }

  // Código 11000: se violó un índice `unique` (ej. email o título repetido)
  if (err instanceof mongo.MongoServerError && err.code === 11000) {
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'campo';
    throw new AppError(409, `Ya existe un registro con ese ${field}`);
  }

  throw err;
}
