// ============================================
// SEED — Datos iniciales (idempotente)
// ============================================
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const courses = [
  {
    title: 'Node.js desde Cero',
    category: 'backend',
    instructor: 'Ana Torres',
    price: 49.99,
    durationHours: 12,
    active: true,
    lessons: [
      { title: 'Introducción a Node.js', order: 1 },
      { title: 'Módulos y npm', order: 2 },
      { title: 'Sistema de archivos', order: 3 },
    ],
  },
  {
    title: 'React Avanzado',
    category: 'frontend',
    instructor: 'Carlos Ruiz',
    price: 59.99,
    durationHours: 18,
    active: true,
    lessons: [
      { title: 'Hooks avanzados', order: 1 },
      { title: 'Context API', order: 2 },
    ],
  },
  {
    title: 'Bases de Datos SQL',
    category: 'data',
    instructor: 'María Gómez',
    price: 39.99,
    durationHours: 10,
    active: true,
    lessons: [
      { title: 'Modelo relacional', order: 1 },
      { title: 'Joins y subconsultas', order: 2 },
    ],
  },
  {
    title: 'Diseño UX/UI',
    category: 'design',
    instructor: 'Laura Pérez',
    price: 34.99,
    durationHours: 8,
    active: false,
    lessons: [{ title: 'Principios de diseño', order: 1 }],
  },
  {
    title: 'DevOps con Docker',
    category: 'devops',
    instructor: 'Pedro Ibarra',
    price: 79.99,
    durationHours: 16,
    active: true,
    lessons: [
      { title: 'Contenedores y Docker Compose', order: 1 },
      { title: 'CI/CD básico', order: 2 },
    ],
  },
];

async function main(): Promise<void> {
  for (const { lessons, ...course } of courses) {
    // upsert por título (es @unique): si ya existe, no lo duplica —
    // así el seed se puede correr varias veces sin ensuciar la base.
    const created = await prisma.course.upsert({
      where: { title: course.title },
      update: {},
      create: course,
    });

    for (const lesson of lessons) {
      await prisma.lesson.upsert({
        where: { courseId_order: { courseId: created.id, order: lesson.order } },
        update: {},
        create: { ...lesson, courseId: created.id },
      });
    }

    console.log(`Curso listo: ${created.title} (${lessons.length} lecciones)`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
