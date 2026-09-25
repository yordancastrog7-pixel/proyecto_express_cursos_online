// TESTS DE INTEGRACIÓN — capas de seguridad (Helmet, CORS, roles, sanitización, rate limit)
// Este archivo tiene su PROPIO contador de rate limit (cada archivo de test carga la app
// de cero), así puede gastar los 5 intentos de login sin afectar a los otros archivos.
// Por eso la prueba del 429 va al FINAL: los tests de un archivo corren en orden.
import request from 'supertest';
import app from '../app';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/db';
import { createUser, sessionCookies } from './helpers/factories';

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

describe('Helmet', () => {
  it('agrega cabeceras de seguridad y oculta X-Powered-By', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('CORS con lista blanca', () => {
  it('un origen permitido recibe Access-Control-Allow-Origin', async () => {
    const res = await request(app).get('/health').set('Origin', 'http://localhost:5173');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('un origen desconocido recibe 403', async () => {
    const res = await request(app).get('/health').set('Origin', 'http://evil.com');

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Origen no permitido por CORS');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('una petición sin Origin (curl, otro servidor) pasa: CORS es una defensa del navegador', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
  });
});

describe('GET /api/v1/users (solo admin)', () => {
  it('401 sin sesión, 403 con rol user, 200 con rol admin', async () => {
    const user = await createUser();
    const admin = await createUser({ role: 'admin' });

    const anonymous = await request(app).get('/api/v1/users');
    const asUser = await request(app).get('/api/v1/users').set('Cookie', await sessionCookies(user));
    const asAdmin = await request(app).get('/api/v1/users').set('Cookie', await sessionCookies(admin));

    expect(anonymous.status).toBe(401);
    expect(asUser.status).toBe(403);
    expect(asAdmin.status).toBe(200);
    expect(asAdmin.body.data).toHaveLength(2);
    asAdmin.body.data.forEach((u: object) => {
      expect(u).not.toHaveProperty('password');
      expect(u).not.toHaveProperty('refreshToken');
    });
  });
});

describe('Errores generales', () => {
  it('una ruta que no existe responde 404 en JSON', async () => {
    const res = await request(app).get('/api/v1/no-existe');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not Found');
  });

  it('un body con JSON mal escrito responde 400, no 500', async () => {
    const res = await request(app).post('/api/v1/auth/register').set('Content-Type', 'application/json').send('{"name":');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('El cuerpo de la petición no es un JSON válido');
  });

  it('las respuestas de /api traen las cabeceras del límite general', async () => {
    const res = await request(app).get('/api/v1/courses');

    expect(res.headers['x-ratelimit-limit']).toBe('100');
    expect(Number(res.headers['x-ratelimit-remaining'])).toBeLessThan(100);
  });
});

// ⚠️ Estos dos tests comparten el contador de /login (5 intentos por 15 minutos). Van al
// final y en este orden a propósito: el primero gasta 1 intento, el segundo gasta 4 más
// y el sexto es rechazado.
describe('Protección de /login', () => {
  it('inyección NoSQL: los operadores $ se eliminan y el login no entra (400)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: { $gt: '' }, password: { $gt: '' } });

    expect(res.status).toBe(400);
  });

  it('rate limit: tras 5 intentos, el sexto recibe 429 con las cabeceras del límite', async () => {
    for (let attempt = 1; attempt <= 4; attempt++) {
      const res = await request(app).post('/api/v1/auth/login').send({ email: 'nadie@correo.com', password: 'Incorrecta999' });
      expect(res.status).toBe(401); // intentos 2 a 5: siguen respondiendo, pero fallan
    }

    const blocked = await request(app).post('/api/v1/auth/login').send({ email: 'nadie@correo.com', password: 'Incorrecta999' });

    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toBe('Too Many Requests');
    expect(blocked.headers['x-ratelimit-remaining']).toBe('0');
    expect(blocked.headers['retry-after']).toBeDefined();
  });
});
