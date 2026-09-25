// TESTS UNITARIOS — auth.service.ts
// "Unitario" = se prueba UNA pieza aislada. Por eso el repository, bcrypt y el
// servicio de tokens están simulados (mock): aquí no hay base de datos ni criptografía
// real, solo la lógica propia de auth.service.
import bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import * as service from '../services/auth.service';
import * as usersRepo from '../repositories/users.repository';
import * as tokens from '../services/token.service';
import { AppError } from '../errors/AppError';

jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));
jest.mock('../repositories/users.repository');
jest.mock('../services/token.service');

const mockedBcrypt = jest.mocked(bcrypt);
const mockedRepo = jest.mocked(usersRepo);
const mockedTokens = jest.mocked(tokens);

// Un "usuario de la base" falso, como lo devolvería el repository.
const userDoc = (overrides: Record<string, unknown> = {}) =>
  ({
    _id: new Types.ObjectId(),
    name: 'Ana Torres',
    email: 'ana@correo.com',
    role: 'user',
    password: 'hash-guardado',
    createdAt: new Date('2026-01-01'),
    ...overrides,
  }) as never;

const dto = { name: 'Ana Torres', email: 'ana@correo.com', password: 'Secreta123' };

describe('auth.service', () => {
  describe('register', () => {
    it('hashea la contraseña con 10 rondas y guarda el hash, nunca el texto plano', async () => {
      // Arrange
      mockedBcrypt.hash.mockResolvedValue('hash-falso' as never);
      mockedRepo.create.mockResolvedValue(userDoc());

      // Act
      const result = await service.register(dto);

      // Assert
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('Secreta123', 10);
      expect(mockedRepo.create).toHaveBeenCalledWith({ name: dto.name, email: dto.email, password: 'hash-falso' });
      expect(result).toMatchObject({ name: 'Ana Torres', email: 'ana@correo.com', role: 'user' });
      expect(result).not.toHaveProperty('password');
    });

    it('propaga el AppError(409) cuando el email ya existe', async () => {
      mockedBcrypt.hash.mockResolvedValue('hash-falso' as never);
      mockedRepo.create.mockRejectedValue(new AppError(409, 'Ya existe un registro con ese email'));

      await expect(service.register(dto)).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('login', () => {
    it('con credenciales correctas devuelve el usuario y guarda el hash del refresh token', async () => {
      const doc = userDoc();
      mockedRepo.findByEmailWithPassword.mockResolvedValue(doc);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedTokens.signAccessToken.mockReturnValue('access-falso');
      mockedTokens.signRefreshToken.mockReturnValue('refresh-falso');
      mockedTokens.hashToken.mockReturnValue('hash-del-refresh');

      const result = await service.login({ email: dto.email, password: dto.password });

      const userId = (doc as { _id: Types.ObjectId })._id.toString();
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(dto.password, 'hash-guardado');
      expect(mockedTokens.signAccessToken).toHaveBeenCalledWith(userId, 'user');
      expect(mockedRepo.setRefreshToken).toHaveBeenCalledWith(userId, 'hash-del-refresh');
      expect(result.tokens).toEqual({ accessToken: 'access-falso', refreshToken: 'refresh-falso' });
      expect(result.user).not.toHaveProperty('password');
    });

    it('con contraseña incorrecta lanza AppError(401) y no emite tokens', async () => {
      mockedRepo.findByEmailWithPassword.mockResolvedValue(userDoc());
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.login({ email: dto.email, password: 'Mala12345' })).rejects.toMatchObject({
        statusCode: 401,
        message: 'Credenciales inválidas',
      });
      expect(mockedTokens.signAccessToken).not.toHaveBeenCalled();
      expect(mockedRepo.setRefreshToken).not.toHaveBeenCalled();
    });

    it('con email inexistente da el MISMO 401 y aun así ejecuta bcrypt.compare (mismo tiempo de respuesta)', async () => {
      mockedRepo.findByEmailWithPassword.mockResolvedValue(null as never);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.login({ email: 'nadie@correo.com', password: dto.password })).rejects.toMatchObject({
        statusCode: 401,
        message: 'Credenciales inválidas',
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledTimes(1);
    });

    it("si el documento no trae un rol válido, se trata como 'user'", async () => {
      mockedRepo.findByEmailWithPassword.mockResolvedValue(userDoc({ role: 'rol-raro' }));
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedTokens.signRefreshToken.mockReturnValue('refresh-falso');

      const result = await service.login({ email: dto.email, password: dto.password });

      expect(result.user.role).toBe('user');
    });
  });

  describe('getProfile', () => {
    it('devuelve el perfil público del usuario', async () => {
      mockedRepo.findById.mockResolvedValue(userDoc({ role: 'admin' }));

      const profile = await service.getProfile('id-cualquiera');

      expect(profile).toMatchObject({ email: 'ana@correo.com', role: 'admin' });
    });

    it('lanza AppError(401) si el usuario ya no existe', async () => {
      mockedRepo.findById.mockResolvedValue(null as never);

      await expect(service.getProfile('id-cualquiera')).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  describe('listUsers', () => {
    it('devuelve todos los usuarios sin contraseña', async () => {
      mockedRepo.findAll.mockResolvedValue([userDoc(), userDoc({ email: 'beto@correo.com' })] as never);

      const users = await service.listUsers();

      expect(users).toHaveLength(2);
      users.forEach((user) => expect(user).not.toHaveProperty('password'));
    });
  });

  describe('refresh', () => {
    const userId = new Types.ObjectId().toString();

    it('sin refresh token lanza AppError(401)', async () => {
      await expect(service.refresh(undefined)).rejects.toMatchObject({ statusCode: 401, message: 'No autenticado' });
    });

    it('si el usuario no tiene un refresh token guardado (sesión cerrada) lanza AppError(401)', async () => {
      mockedTokens.verifyRefreshToken.mockReturnValue({ sub: userId });
      mockedRepo.findByIdWithRefreshToken.mockResolvedValue(userDoc());

      await expect(service.refresh('token')).rejects.toMatchObject({ statusCode: 401, message: 'Sesión inválida' });
    });

    it('detecta la REUTILIZACIÓN de un token ya rotado: cierra la sesión y lanza AppError(401)', async () => {
      mockedTokens.verifyRefreshToken.mockReturnValue({ sub: userId });
      mockedRepo.findByIdWithRefreshToken.mockResolvedValue(userDoc({ refreshToken: 'hash-vigente' }));
      mockedTokens.hashToken.mockReturnValue('hash-de-un-token-viejo');
      mockedTokens.tokenHashesMatch.mockReturnValue(false);

      await expect(service.refresh('token-viejo')).rejects.toMatchObject({ statusCode: 401 });
      expect(mockedRepo.setRefreshToken).toHaveBeenCalledWith(userId, null);
    });

    it('con el token vigente emite un par nuevo y guarda el hash nuevo (rotación)', async () => {
      mockedTokens.verifyRefreshToken.mockReturnValue({ sub: userId });
      mockedRepo.findByIdWithRefreshToken.mockResolvedValue(userDoc({ refreshToken: 'hash-vigente', role: 'admin' }));
      mockedTokens.tokenHashesMatch.mockReturnValue(true);
      mockedTokens.signAccessToken.mockReturnValue('access-nuevo');
      mockedTokens.signRefreshToken.mockReturnValue('refresh-nuevo');
      mockedTokens.hashToken.mockReturnValue('hash-nuevo');

      const result = await service.refresh('token-vigente');

      expect(result).toEqual({ accessToken: 'access-nuevo', refreshToken: 'refresh-nuevo' });
      expect(mockedTokens.signAccessToken).toHaveBeenCalledWith(userId, 'admin'); // el rol se relee de la base
      expect(mockedRepo.setRefreshToken).toHaveBeenCalledWith(userId, 'hash-nuevo');
    });
  });

  describe('logout', () => {
    it('sin refresh token no hace nada', async () => {
      await service.logout(undefined);

      expect(mockedRepo.setRefreshToken).not.toHaveBeenCalled();
    });

    it('con un refresh token válido borra el hash guardado', async () => {
      mockedTokens.verifyRefreshToken.mockReturnValue({ sub: 'abc' });

      await service.logout('token');

      expect(mockedRepo.setRefreshToken).toHaveBeenCalledWith('abc', null);
    });

    it('con un token inválido o vencido termina sin error (no hay nada que invalidar)', async () => {
      mockedTokens.verifyRefreshToken.mockImplementation(() => {
        throw new AppError(401, 'Token inválido');
      });

      await expect(service.logout('basura')).resolves.toBeUndefined();
      expect(mockedRepo.setRefreshToken).not.toHaveBeenCalled();
    });

    it('un error que NO es AppError (un fallo real) sí se propaga', async () => {
      mockedTokens.verifyRefreshToken.mockImplementation(() => {
        throw new Error('fallo inesperado');
      });

      await expect(service.logout('token')).rejects.toThrow('fallo inesperado');
    });
  });
});
