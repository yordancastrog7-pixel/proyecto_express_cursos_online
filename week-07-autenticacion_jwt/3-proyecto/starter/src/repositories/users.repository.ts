// ============================================
// REPOSITORY — User (acceso a datos con Mongoose)
// ============================================
import { User } from '../models/user.model';
import { mapMongooseError } from '../errors/mongooseError';

export interface NewUser {
  name: string;
  email: string;
  password: string; // ya hasheada con bcrypt: aquí nunca llega texto plano
}

export async function create(data: NewUser) {
  try {
    const doc = await User.create(data);
    return doc.toObject();
  } catch (err) {
    mapMongooseError(err);
  }
}

// El password está oculto por defecto (select: false): solo el login lo pide.
export async function findByEmailWithPassword(email: string) {
  return User.findOne({ email }).select('+password').lean();
}

export async function findById(id: string) {
  try {
    return await User.findById(id).lean();
  } catch (err) {
    mapMongooseError(err);
  }
}

export async function findByIdWithRefreshToken(id: string) {
  try {
    return await User.findById(id).select('+refreshToken').lean();
  } catch (err) {
    mapMongooseError(err);
  }
}

// `null` borra el hash guardado (logout o sesión invalidada).
export async function setRefreshToken(id: string, tokenHash: string | null): Promise<void> {
  try {
    if (tokenHash) {
      await User.updateOne({ _id: id }, { $set: { refreshToken: tokenHash } });
    } else {
      await User.updateOne({ _id: id }, { $unset: { refreshToken: '' } });
    }
  } catch (err) {
    mapMongooseError(err);
  }
}
