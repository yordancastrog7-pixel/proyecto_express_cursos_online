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

## Última entrega — `week-07` · Autenticación JWT

La API de cursos ahora es **privada**: solo responde a usuarios con sesión. Incluye registro
y login con contraseñas hasheadas con `bcrypt`, access token (15 min) y refresh token (7 días)
guardados en **cookies HttpOnly**, refresh con **rotación** y detección de reutilización,
logout que invalida la sesión, y un `authMiddleware` que protege todas las rutas de
`Course`. Los secretos viven en el `.env`, nunca en el código.

Ver detalle completo en [`week-07-autenticacion_jwt/3-proyecto/starter/README.md`](./week-07-autenticacion_jwt/3-proyecto/starter/README.md).

## Stack

Node.js · TypeScript · Express · PostgreSQL · Prisma · MongoDB · Mongoose · JWT · bcrypt · Docker · pnpm
