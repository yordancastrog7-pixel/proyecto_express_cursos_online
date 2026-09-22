// ============================================
// AUTH SERVICE — registro, login, refresh y logout
// ============================================
import bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import { SALT_ROUNDS } from '../config/auth.config';
import { AppError } from '../errors/AppError';
import { PublicUser, TokenPair } from '../types';
import { RegisterDto, LoginDto } from '../schemas/auth.schema';
import * as usersRepo from '../repositories/users.repository';
import * as tokens from './token.service';

// Se calcula una vez al cargar el módulo (async, sin bloquear el servidor).
// Sirve para que el login tarde lo mismo exista o no el email (ver login()).
const dummyHash = bcrypt.hash('contraseña-de-relleno', SALT_ROUNDS);

function toPublicUser(user: { _id: Types.ObjectId; name: string; email: string; createdAt?: Date }): PublicUser {
  return { id: user._id.toString(), name: user.name, email: user.email, createdAt: user.createdAt };
}

// Emite un par de tokens nuevo y guarda el hash del refresh token: reemplaza al
// anterior, así que el refresh token viejo queda inservible (rotación).
async function issueTokens(userId: string): Promise<TokenPair> {
  const accessToken = tokens.signAccessToken(userId);
  const refreshToken = tokens.signRefreshToken(userId);

  await usersRepo.setRefreshToken(userId, tokens.hashToken(refreshToken));

  return { accessToken, refreshToken };
}

export async function register(dto: RegisterDto): Promise<PublicUser> {
  const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
  const created = await usersRepo.create({ name: dto.name, email: dto.email, password: passwordHash });
  return toPublicUser(created);
}

export async function login(dto: LoginDto): Promise<{ user: PublicUser; tokens: TokenPair }> {
  const user = await usersRepo.findByEmailWithPassword(dto.email);

  // Se hace bcrypt.compare SIEMPRE, aunque el email no exista (contra un hash de
  // relleno). Así, ni el mensaje ni el tiempo de respuesta delatan si un email
  // está registrado o no (enumeración de usuarios).
  const passwordOk = await bcrypt.compare(dto.password, user?.password ?? (await dummyHash));

  // Mismo error para "email no existe" y "contraseña incorrecta".
  if (!user || !passwordOk) {
    throw new AppError(401, 'Credenciales inválidas');
  }

  const userId = user._id.toString();
  return { user: toPublicUser(user), tokens: await issueTokens(userId) };
}

export async function getProfile(userId: string): Promise<PublicUser> {
  const user = await usersRepo.findById(userId);
  if (!user) {
    // Token válido pero el usuario ya no existe.
    throw new AppError(401, 'No autenticado');
  }
  return toPublicUser(user);
}

export async function refresh(refreshToken: string | undefined): Promise<TokenPair> {
  if (!refreshToken) {
    throw new AppError(401, 'No autenticado');
  }

  const { sub: userId } = tokens.verifyRefreshToken(refreshToken);
  const user = await usersRepo.findByIdWithRefreshToken(userId);

  if (!user?.refreshToken) {
    throw new AppError(401, 'Sesión inválida');
  }

  if (!tokens.tokenHashesMatch(tokens.hashToken(refreshToken), user.refreshToken)) {
    // El token es auténtico (firma y fecha válidas) pero NO es el vigente: ya fue
    // rotado. Alguien lo está reutilizando (posible robo) → se cierra la sesión
    // completa, para que tampoco sirva el token nuevo.
    await usersRepo.setRefreshToken(userId, null);
    throw new AppError(401, 'Sesión inválida');
  }

  return issueTokens(userId);
}

// El logout no exige un access token vigente: con el refresh token alcanza para
// saber a quién cerrarle la sesión. Si el token no sirve, no hay nada que invalidar.
export async function logout(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) return;

  try {
    const { sub: userId } = tokens.verifyRefreshToken(refreshToken);
    await usersRepo.setRefreshToken(userId, null);
  } catch (err) {
    if (!(err instanceof AppError)) throw err;
  }
}
