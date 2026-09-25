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
| 07 | Autenticación JWT (bcrypt, access/refresh tokens, cookies HttpOnly) | ✅ |
| 08 | Autorización y seguridad (RBAC, Helmet, CORS, rate limiting, sanitización) | ✅ |

## Última entrega — `week-08` · Autorización y seguridad

La API distingue ahora **quién puede hacer qué**: dos roles (`user` y `admin`) con un
middleware `requireRole()`, y la regla de que solo el creador de un curso (o un admin)
puede modificarlo. Se suman las capas de protección: **Helmet** (cabeceras seguras),
**CORS con lista blanca**, **rate limiting** (general y estricto en login/registro con
respuesta 429), **sanitización contra inyección NoSQL** y errores sin stack trace en
producción. El primer administrador se crea con `pnpm seed:admin` desde el `.env`.

Ver detalle completo en [`week-08-autorizacion_seguridad/3-proyecto/starter/README.md`](./week-08-autorizacion_seguridad/3-proyecto/starter/README.md).

## Stack

Node.js · TypeScript · Express · PostgreSQL · Prisma · MongoDB · Mongoose · JWT · bcrypt · Helmet · Docker · pnpm
