// TESTS UNITARIOS — token.service.ts (firma, verificación y hash de tokens)
// No hay nada que simular: es lógica pura. Se prueba NUESTRA envoltura (qué aceptamos
// y qué rechazamos), no la librería jsonwebtoken. Para fabricar tokens "malos" se
// firma a mano con jsonwebtoken.
import jwt from 'jsonwebtoken';
import * as tokens from '../services/token.service';

const ACCESS_SECRET = process.env['JWT_ACCESS_SECRET'] as string;
const USER_ID = '65f000000000000000000001';

describe('token.service', () => {
  describe('access token', () => {
    it('lo que se firma se puede verificar y trae el id y el rol', () => {
      const token = tokens.signAccessToken(USER_ID, 'admin');

      expect(tokens.verifyAccessToken(token)).toEqual({ sub: USER_ID, role: 'admin' });
    });

    it('rechaza un token vencido con un mensaje propio', () => {
      const expired = jwt.sign({ role: 'user' }, ACCESS_SECRET, { subject: USER_ID, expiresIn: -10 });

      expect(() => tokens.verifyAccessToken(expired)).toThrow(expect.objectContaining({ statusCode: 401, message: 'El token expiró' }));
    });

    it('rechaza un token firmado con otro secreto', () => {
      const forged = jwt.sign({ role: 'admin' }, 'otro-secreto-que-no-es-el-real-1234567890', { subject: USER_ID });

      expect(() => tokens.verifyAccessToken(forged)).toThrow(expect.objectContaining({ statusCode: 401, message: 'Token inválido' }));
    });

    it('rechaza texto que ni siquiera es un JWT', () => {
      expect(() => tokens.verifyAccessToken('esto.no.es.un.jwt')).toThrow(expect.objectContaining({ statusCode: 401 }));
    });

    it('rechaza un token con firma válida pero sin un rol reconocido', () => {
      const sinRol = jwt.sign({}, ACCESS_SECRET, { subject: USER_ID });
      const rolFalso = jwt.sign({ role: 'superadmin' }, ACCESS_SECRET, { subject: USER_ID });

      expect(() => tokens.verifyAccessToken(sinRol)).toThrow(expect.objectContaining({ statusCode: 401 }));
      expect(() => tokens.verifyAccessToken(rolFalso)).toThrow(expect.objectContaining({ statusCode: 401 }));
    });

    it('rechaza un token firmado sin `sub` o cuyo contenido es solo texto', () => {
      const sinSub = jwt.sign({ role: 'user' }, ACCESS_SECRET);
      const soloTexto = jwt.sign('solo-texto', ACCESS_SECRET);

      expect(() => tokens.verifyAccessToken(sinSub)).toThrow(expect.objectContaining({ statusCode: 401 }));
      expect(() => tokens.verifyAccessToken(soloTexto)).toThrow(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('refresh token', () => {
    it('lo que se firma se puede verificar', () => {
      const token = tokens.signRefreshToken(USER_ID);

      expect(tokens.verifyRefreshToken(token)).toEqual({ sub: USER_ID });
    });

    it('dos refresh tokens del mismo usuario nunca son iguales (jwtid)', () => {
      expect(tokens.signRefreshToken(USER_ID)).not.toBe(tokens.signRefreshToken(USER_ID));
    });

    it('un refresh token NO sirve como access token (secretos distintos)', () => {
      const refresh = tokens.signRefreshToken(USER_ID);

      expect(() => tokens.verifyAccessToken(refresh)).toThrow(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('hashToken y tokenHashesMatch', () => {
    it('el hash es un SHA-256 en hexadecimal (64 caracteres) y es estable', () => {
      const hash = tokens.hashToken('token-de-prueba');

      expect(hash).toMatch(/^[0-9a-f]{64}$/);
      expect(tokens.hashToken('token-de-prueba')).toBe(hash);
    });

    it('tokens distintos dan hashes distintos', () => {
      expect(tokens.hashToken('uno')).not.toBe(tokens.hashToken('dos'));
    });

    it('compara hashes: iguales → true, distintos → false, de distinto largo → false', () => {
      const hash = tokens.hashToken('uno');

      expect(tokens.tokenHashesMatch(hash, hash)).toBe(true);
      expect(tokens.tokenHashesMatch(hash, tokens.hashToken('dos'))).toBe(false);
      expect(tokens.tokenHashesMatch(hash, 'corto')).toBe(false);
    });
  });
});
