// Ayudantes para armar datos de prueba sin repetir código en cada test.
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import type { Response } from 'supertest';
import { User } from '../../models/user.model';
import { Course } from '../../models/course.model';
import { Role, ROLES } from '../../config/roles';
import * as usersRepo from '../../repositories/users.repository';
import * as tokens from '../../services/token.service';

export const TEST_PASSWORD = 'Secreta123';

export const validCourse = {
  title: 'Node.js desde Cero',
  category: 'backend',
  instructor: 'Ana Torres',
  price: 49.99,
  durationHours: 12,
};

export interface TestUser {
  id: string;
  email: string;
  role: Role;
}

// Inserta un usuario directo en la base (sin pasar por HTTP): así los tests de otras
// rutas no gastan el límite de 5 registros/logins por 15 minutos.
// Usa 4 rondas de bcrypt (no 10) solo para que los tests corran rápido.
export async function createUser(overrides: { email?: string; role?: Role } = {}): Promise<TestUser> {
  const user = await User.create({
    name: 'Usuario de Prueba',
    email: overrides.email ?? `user-${crypto.randomUUID()}@test.com`,
    password: await bcrypt.hash(TEST_PASSWORD, 4),
    role: overrides.role ?? ROLES.USER,
  });

  return { id: user.id, email: user.email, role: overrides.role ?? ROLES.USER };
}

// Arma las cookies de una sesión ya iniciada (access + refresh) sin hacer login por HTTP.
// Se usan con: request(app).get(...).set('Cookie', cookies)
export async function sessionCookies(user: TestUser): Promise<string[]> {
  const refreshToken = tokens.signRefreshToken(user.id);
  await usersRepo.setRefreshToken(user.id, tokens.hashToken(refreshToken));

  return [`accessToken=${tokens.signAccessToken(user.id, user.role)}`, `refreshToken=${refreshToken}`];
}

export async function createCourse(createdBy: string, overrides: Partial<typeof validCourse> = {}) {
  const course = await Course.create({ ...validCourse, ...overrides, createdBy });
  return course.id as string;
}

// Lee el valor de una cookie desde la cabecera Set-Cookie de una respuesta.
export function cookieValue(res: Response, name: string): string | undefined {
  const cookies = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
  const raw = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  return raw?.split(';')[0]?.slice(name.length + 1);
}
