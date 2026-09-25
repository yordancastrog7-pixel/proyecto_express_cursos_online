// Base de datos de MongoDB EN MEMORIA para los tests de integración: es un MongoDB
// real pero temporal, sin tocar ninguna base de tu máquina. Se crea en beforeAll,
// se vacía en afterEach y se destruye en afterAll.
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../../models/user.model';
import { Course } from '../../models/course.model';

let mongod: MongoMemoryServer;

export async function connectTestDb(): Promise<void> {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  // Espera a que existan los índices `unique` (email, title): sin ellos, el primer
  // test de "duplicado" podría correr antes de que Mongo los haya creado.
  await Promise.all([User.init(), Course.init()]);
}

export async function clearTestDb(): Promise<void> {
  await Promise.all([User.deleteMany({}), Course.deleteMany({})]);
}

export async function disconnectTestDb(): Promise<void> {
  await mongoose.disconnect();
  await mongod.stop();
}
