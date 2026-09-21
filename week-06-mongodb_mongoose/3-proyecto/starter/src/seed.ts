// ============================================
// SEED — Datos iniciales (idempotente)
// ============================================
import mongoose from 'mongoose';
import { Category } from './models/category.model';
import { Course } from './models/course.model';

const categories = [
  { name: 'backend', description: 'Desarrollo del lado del servidor' },
  { name: 'frontend', description: 'Interfaces y experiencia de usuario' },
  { name: 'data', description: 'Bases de datos y análisis de datos' },
  { name: 'design', description: 'Diseño UX/UI' },
  { name: 'devops', description: 'Infraestructura, CI/CD y contenedores' },
];

const courses = [
  { title: 'Node.js desde Cero', categoryName: 'backend', instructor: 'Ana Torres', price: 49.99, durationHours: 12 },
  { title: 'React Avanzado', categoryName: 'frontend', instructor: 'Carlos Ruiz', price: 59.99, durationHours: 18 },
  { title: 'Bases de Datos NoSQL', categoryName: 'data', instructor: 'María Gómez', price: 39.99, durationHours: 10 },
  { title: 'Diseño UX/UI', categoryName: 'design', instructor: 'Laura Pérez', price: 34.99, durationHours: 8, active: false },
  { title: 'DevOps con Docker', categoryName: 'devops', instructor: 'Pedro Ibarra', price: 79.99, durationHours: 16 },
];

async function main(): Promise<void> {
  const uri = process.env['MONGODB_URI'];
  if (!uri) {
    throw new Error('MONGODB_URI no está definida en el .env');
  }

  await mongoose.connect(uri);

  // upsert por `name`/`title` (ambos @unique): correr el seed varias veces
  // no duplica nada.
  const categoryIds = new Map<string, mongoose.Types.ObjectId>();
  for (const cat of categories) {
    const doc = await Category.findOneAndUpdate(
      { name: cat.name },
      { $setOnInsert: cat },
      { upsert: true, returnDocument: 'after' },
    );
    categoryIds.set(cat.name, doc._id);
    console.log(`Categoría lista: ${doc.name}`);
  }

  for (const { categoryName, ...course } of courses) {
    const categoryId = categoryIds.get(categoryName);
    const doc = await Course.findOneAndUpdate(
      { title: course.title },
      { $setOnInsert: { ...course, category: categoryId } },
      { upsert: true, returnDocument: 'after' },
    );
    console.log(`Curso listo: ${doc.title}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
