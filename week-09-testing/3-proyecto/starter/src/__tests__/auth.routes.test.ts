// TESTS DE INTEGRACIÓN — rutas /api/v1/auth
// "Integración" = se prueba el camino completo: ruta → controller → service →
// repository → base de datos. La base es MongoDB EN MEMORIA (nada simulado), y
// Supertest llama a la app sin abrir un puerto real.
//
// Ojo: /register y /login tienen un límite de 5 peticiones por 15 minutos, así que
// este archivo hace pocas llamadas reales a esas rutas (los demás usuarios y sesiones
// se arman directo en la base con las funciones de helpers/factories).
import request from 'supertest';
import app from '../app';
import { User } from '../models/user.model';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/db';
import { createUser, sessionCookies, cookieValue, TEST_PASSWORD } from './helpers/factories';

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

const newUser = { name: 'Ana Torres', email: 'ana@correo.com', password: 'Secreta123' };

describe('POST /api/v1/auth/register', () => {
  it('201: crea el usuario, devuelve sus datos públicos y guarda la contraseña hasheada', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(newUser);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ name: 'Ana Torres', email: 'ana@correo.com', role: 'user' });
    expect(res.body.data).not.toHaveProperty('password');

    const stored = await User.findOne({ email: newUser.email }).select('+password').lean();
    expect(stored?.password).toBeDefined();
    expect(stored?.password).not.toBe(newUser.password); // nunca texto plano
  });

  it("aunque el body traiga role:'admin', el usuario queda como 'user' (mass assignment)", async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...newUser, role: 'admin' });

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('user');
  });

  it('409: no deja registrar dos veces el mismo email', async () => {
    await request(app).post('/api/v1/auth/register').send(newUser);

    const res = await request(app).post('/api/v1/auth/register').send(newUser);

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('email');
  });

  it('400: datos inválidos devuelven la lista de errores', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ name: 'A', email: 'no-es-email', password: 'corta' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
    expect(res.body.issues.length).toBeGreaterThanOrEqual(3);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('200: entrega los tokens en cookies HttpOnly y NO en el body', async () => {
    const user = await createUser({ email: 'ana@correo.com' });

    const res = await request(app).post('/api/v1/auth/login').send({ email: user.email, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ email: 'ana@correo.com', role: 'user' });
    expect(JSON.stringify(res.body)).not.toMatch(/eyJ/); // ningún JWT en el cuerpo

    const cookies = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
    const access = cookies.find((c) => c.startsWith('accessToken='));
    const refresh = cookies.find((c) => c.startsWith('refreshToken='));
    expect(access).toMatch(/HttpOnly/i);
    expect(refresh).toMatch(/HttpOnly/i);
    expect(refresh).toMatch(/Path=\/api\/v1\/auth/); // el refresh solo viaja hacia /auth
  });

  it('401: contraseña incorrecta', async () => {
    const user = await createUser();

    const res = await request(app).post('/api/v1/auth/login').send({ email: user.email, password: 'Incorrecta999' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Credenciales inválidas');
  });

  it('401: email inexistente, con el MISMO mensaje (no revela qué emails existen)', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'nadie@correo.com', password: 'Incorrecta999' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Credenciales inválidas');
  });
});

describe('GET /api/v1/auth/me', () => {
  it('200: con sesión devuelve el perfil sin contraseña', async () => {
    const user = await createUser({ role: 'admin' });

    const res = await request(app).get('/api/v1/auth/me').set('Cookie', await sessionCookies(user));

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: user.id, email: user.email, role: 'admin' });
    expect(res.body.data).not.toHaveProperty('password');
  });

  it('401: sin cookie', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
  });

  it('401: con un token falso', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Cookie', 'accessToken=esto.no.es.un.jwt');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Token inválido');
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('200: renueva la sesión y ROTA el refresh token; el viejo deja de servir', async () => {
    const user = await createUser();
    const cookies = await sessionCookies(user);
    const oldRefresh = cookies[1]!.slice('refreshToken='.length);

    const res = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookies);

    expect(res.status).toBe(200);
    const newRefresh = cookieValue(res, 'refreshToken');
    expect(newRefresh).toBeDefined();
    expect(newRefresh).not.toBe(oldRefresh); // rotación

    // Reutilizar el token viejo → 401 (y se cierra la sesión completa)
    const replay = await request(app).post('/api/v1/auth/refresh').set('Cookie', `refreshToken=${oldRefresh}`);
    expect(replay.status).toBe(401);

    // Como se detectó la reutilización, ni el token nuevo sirve ya
    const afterReplay = await request(app).post('/api/v1/auth/refresh').set('Cookie', `refreshToken=${newRefresh}`);
    expect(afterReplay.status).toBe(401);
  });

  it('401: sin cookie de refresh', async () => {
    const res = await request(app).post('/api/v1/auth/refresh');

    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('204: cierra la sesión, borra las cookies e invalida el refresh token', async () => {
    const user = await createUser();
    const cookies = await sessionCookies(user);

    const res = await request(app).post('/api/v1/auth/logout').set('Cookie', cookies);

    expect(res.status).toBe(204);
    const cleared = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
    expect(cleared.some((c) => c.startsWith('accessToken=;'))).toBe(true);

    const refreshAfter = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookies);
    expect(refreshAfter.status).toBe(401);
  });

  it('204: también funciona sin cookies (no falla)', async () => {
    const res = await request(app).post('/api/v1/auth/logout');

    expect(res.status).toBe(204);
  });
});
