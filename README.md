Cada carpeta `week-XX/` tiene su propio `README.md` con instrucciones específicas de esa entrega.

## Progreso

| Semana | Tema | Estado |
|---|---|---|
| 01 | Fundamentos de Node.js (CLI + TypeScript) | ✅ |
| 02 | Servidor Express con CRUD completo | ✅ |
| 03 | API REST con arquitectura en capas | ✅ |
| 04 | Validación (Zod), errores (AppError) y logging (Winston/Morgan) | ✅ |
| 05 | PostgreSQL + Prisma ORM (relación 1:N Course-Lesson) | ✅ |

## Última entrega — `week-05` · PostgreSQL + Prisma

Migra la API de memoria a PostgreSQL usando Prisma ORM: migraciones versionadas,
seed idempotente, y un nuevo recurso relacionado `Lesson` (relación 1:N con
`Course`, incluida vía `include` en el detalle). Manejo de errores de base de
datos (`P2025` → 404, `P2002` → 409) integrado con el `AppError` de la semana 04.

Ver detalle completo en [`week-05-postgresql_prisma/3-proyecto/starter/README.md`](./week-05-postgresql_prisma/3-proyecto/starter/README.md).

## Stack

Node.js · TypeScript · Express · PostgreSQL · Prisma · Docker · pnpm