Cada carpeta `week-XX/` tiene su propio `README.md` con instrucciones específicas de esa entrega.

## Progreso

| Semana | Tema | Estado |
|---|---|---|
| 01 | Fundamentos de Node.js (CLI + TypeScript) | ✅ |
| 02 | Servidor Express con CRUD completo | ✅ |
| 03 | API REST con arquitectura en capas | ✅ |
| 04 | Validación (Zod), errores (AppError) y logging (Winston/Morgan) | ✅ |
| 05 | PostgreSQL + Prisma ORM (relación 1:N Course-Lesson) | ✅ |
| 06 | MongoDB + Mongoose (referencia Course-Category con populate) | ✅ |

## Última entrega — `week-06` · MongoDB + Mongoose

Implementación en paralelo de la misma API sobre MongoDB con Mongoose (para comparar
SQL vs. NoSQL): nuevo recurso relacionado `Category` con CRUD propio, referenciado
desde `Course` vía `ObjectId` + `populate()`, paginación, y manejo de errores
específicos de Mongo (`CastError` → 400, código `11000` → 409) integrado con el
`AppError` de la semana 04.

Ver detalle completo en [`week-06-mongodb_mongoose/3-proyecto/starter/README.md`](./week-06-mongodb_mongoose/3-proyecto/starter/README.md).

## Stack

Node.js · TypeScript · Express · PostgreSQL · Prisma · MongoDB · Mongoose · Docker · pnpm
