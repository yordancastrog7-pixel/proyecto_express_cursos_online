// TESTS DE INTEGRACIÓN — rutas /api/v1/courses (CRUD + permisos por rol)
// Las sesiones se arman con cookies fabricadas (helpers/factories): así no se gasta
// el límite de logins y cada test elige qué rol quiere ser.
import request from 'supertest';
import { Types } from 'mongoose';
import app from '../app';
import { Course } from '../models/course.model';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/db';
import { createUser, createCourse, sessionCookies, validCourse, TestUser } from './helpers/factories';

const API = '/api/v1/courses';

let owner: TestUser;
let stranger: TestUser;
let admin: TestUser;
let ownerCookies: string[];
let strangerCookies: string[];
let adminCookies: string[];

beforeAll(connectTestDb);
afterAll(disconnectTestDb);

// Cada test arranca con la base vacía y tres personas nuevas: no depende de ningún otro.
beforeEach(async () => {
  owner = await createUser();
  stranger = await createUser();
  admin = await createUser({ role: 'admin' });
  [ownerCookies, strangerCookies, adminCookies] = await Promise.all([owner, stranger, admin].map(sessionCookies));
});
afterEach(clearTestDb);

describe('GET /api/v1/courses (público)', () => {
  it('200: sin cursos devuelve una lista vacía', async () => {
    const res = await request(app).get(API);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [], total: 0, page: 1, totalPages: 0 });
  });

  it('200: pagina los resultados', async () => {
    await createCourse(owner.id, { title: 'Curso 1' });
    await createCourse(owner.id, { title: 'Curso 2' });
    await createCourse(owner.id, { title: 'Curso 3' });

    const res = await request(app).get(`${API}?page=2&limit=2`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body).toMatchObject({ total: 3, page: 2, totalPages: 2 });
  });
});

describe('GET /api/v1/courses/:id (público)', () => {
  it('200: devuelve el curso', async () => {
    const id = await createCourse(owner.id);

    const res = await request(app).get(`${API}/${id}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ title: validCourse.title, price: validCourse.price });
  });

  it('404: un id válido que no existe', async () => {
    const res = await request(app).get(`${API}/${new Types.ObjectId()}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Curso no encontrado');
  });

  it('400: un id mal formado', async () => {
    const res = await request(app).get(`${API}/abc`);

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/courses', () => {
  it('201: crea el curso y lo deja a nombre de quien tiene la sesión (ignora createdBy del body)', async () => {
    const res = await request(app)
      .post(API)
      .set('Cookie', ownerCookies)
      .send({ ...validCourse, createdBy: new Types.ObjectId().toString() });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ title: validCourse.title, active: true, createdBy: owner.id });
  });

  it('400: datos inválidos devuelven issues', async () => {
    const res = await request(app).post(API).set('Cookie', ownerCookies).send({ price: -5 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
    expect(res.body.issues.length).toBeGreaterThan(0);
  });

  it('401: sin sesión', async () => {
    const res = await request(app).post(API).send(validCourse);

    expect(res.status).toBe(401);
  });

  it('409: título repetido', async () => {
    await createCourse(owner.id);

    const res = await request(app).post(API).set('Cookie', ownerCookies).send(validCourse);

    expect(res.status).toBe(409);
  });
});

describe('PATCH /api/v1/courses/:id (creador o admin)', () => {
  it('200: el creador modifica su curso', async () => {
    const id = await createCourse(owner.id);

    const res = await request(app).patch(`${API}/${id}`).set('Cookie', ownerCookies).send({ price: 55 });

    expect(res.status).toBe(200);
    expect(res.body.data.price).toBe(55);
  });

  it('200: un admin modifica el curso de otra persona', async () => {
    const id = await createCourse(owner.id);

    const res = await request(app).patch(`${API}/${id}`).set('Cookie', adminCookies).send({ price: 60 });

    expect(res.status).toBe(200);
  });

  it('403: otro usuario no puede modificar un curso ajeno', async () => {
    const id = await createCourse(owner.id);

    const res = await request(app).patch(`${API}/${id}`).set('Cookie', strangerCookies).send({ price: 1 });

    expect(res.status).toBe(403);
    expect((await Course.findById(id))?.price).toBe(validCourse.price); // el curso no cambió
  });

  it('un PATCH sin `active` NO reactiva un curso desactivado', async () => {
    const id = await createCourse(owner.id);
    await Course.updateOne({ _id: id }, { active: false });

    const res = await request(app).patch(`${API}/${id}`).set('Cookie', ownerCookies).send({ price: 70 });

    expect(res.status).toBe(200);
    expect(res.body.data.active).toBe(false);
  });

  it('400: un PATCH vacío', async () => {
    const id = await createCourse(owner.id);

    const res = await request(app).patch(`${API}/${id}`).set('Cookie', ownerCookies).send({});

    expect(res.status).toBe(400);
  });

  it('401: sin sesión', async () => {
    const id = await createCourse(owner.id);

    const res = await request(app).patch(`${API}/${id}`).send({ price: 1 });

    expect(res.status).toBe(401);
  });

  it('404: el curso no existe', async () => {
    const res = await request(app).patch(`${API}/${new Types.ObjectId()}`).set('Cookie', adminCookies).send({ price: 1 });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/courses/:id (solo admin)', () => {
  it('401: sin sesión', async () => {
    const id = await createCourse(owner.id);

    const res = await request(app).delete(`${API}/${id}`);

    expect(res.status).toBe(401);
  });

  it('403: un usuario común no puede borrar, ni siquiera su propio curso', async () => {
    const id = await createCourse(owner.id);

    const res = await request(app).delete(`${API}/${id}`).set('Cookie', ownerCookies);

    expect(res.status).toBe(403);
    expect(await Course.exists({ _id: id })).not.toBeNull(); // sigue existiendo
  });

  it('204: un admin borra el curso', async () => {
    const id = await createCourse(owner.id);

    const res = await request(app).delete(`${API}/${id}`).set('Cookie', adminCookies);

    expect(res.status).toBe(204);
    expect((await request(app).get(`${API}/${id}`)).status).toBe(404);
  });

  it('404: un admin intenta borrar un curso que no existe', async () => {
    const res = await request(app).delete(`${API}/${new Types.ObjectId()}`).set('Cookie', adminCookies);

    expect(res.status).toBe(404);
  });
});
