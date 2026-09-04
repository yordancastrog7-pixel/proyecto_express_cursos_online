# PostgreSQL + Prisma — Cursos Online

Entrega semanal para `bc-expressjs`, semana 05
(ver especificación: [bootcamp/week-05-postgresql_prisma/3-proyecto](../README.md)).

## Dominio asignado

**Plataforma de cursos online** — recurso principal `Course` (el mismo de las semanas 02-04),
ahora persistido en PostgreSQL con Prisma. Esta semana se agrega el recurso secundario
**`Lesson`** (lección), con relación **1:N**: un curso tiene muchas lecciones.

## Diagrama de entidades

```
┌─────────────────────┐          ┌─────────────────────┐
│       Course         │          │        Lesson        │
├─────────────────────┤   1    N ├─────────────────────┤
│ id            UUID PK│─────────▶│ id            UUID PK│
│ title      String @unique       │ title         String │
│ category      String │          │ content   String? │
│ instructor    String │          │ order            Int │
│ price          Float │          │ courseId  UUID FK │
│ durationHours    Int │          │ createdAt DateTime │
│ active       Boolean │          └─────────────────────┘
│ createdAt   DateTime │            @@unique([courseId, order])
│ updatedAt   DateTime │
└─────────────────────┘
```

Un `Course` puede tener muchas `Lesson`; cada `Lesson` pertenece a un único `Course`
(`onDelete: Cascade` — si se borra el curso, se borran sus lecciones).

## Cómo correr

```bash
# 1. Levantar Postgres
docker compose up -d

# 2. Instalar dependencias
pnpm install

# 3. Variables de entorno
cp .env.example .env

# 4. Migración inicial (crea las tablas)
pnpm exec prisma migrate dev --name init

# 5. Cargar datos demo (idempotente, se puede correr varias veces)
pnpm exec prisma db seed

# 6. Arrancar el servidor
pnpm dev       # http://localhost:3005
pnpm build     # verifica TypeScript estricto
```

> **Nota sobre puertos**: si en tu máquina el `5432` o el `3000` ya están ocupados
> (por ejemplo, un PostgreSQL instalado directamente en Windows, u otro proyecto),
> cambia el puerto en `docker-compose.yml` / `.env` — este proyecto usa `5434` para
> Postgres y `3005` para la API precisamente por eso.

## Endpoints

| Método | Ruta | Descripción | Status |
|---|---|---|---|
| GET | `/api/v1/courses?page&limit` | Listado paginado | 200 |
| GET | `/api/v1/courses/:id` | Detalle **con sus lecciones** (`include`) | 200 / 400 / 404 |
| POST | `/api/v1/courses` | Crear (valida con Zod) | 201 / 400 / 409 |
| PUT | `/api/v1/courses/:id` | Actualizar (campos opcionales) | 200 / 400 / 404 |
| DELETE | `/api/v1/courses/:id` | Eliminar (borra sus lecciones en cascada) | 204 / 400 / 404 |

También disponible: `GET /health`.

## Ejemplos de request/response

```bash
# Listado paginado
curl "http://localhost:3005/api/v1/courses?page=1&limit=2"
# → 200 { "data": [...], "total": 5, "page": 1, "limit": 2 }

# Detalle con lecciones incluidas
curl http://localhost:3005/api/v1/courses/<uuid>
# → 200 { "data": { "id": "...", "title": "...", ..., "lessons": [ {...}, {...} ] } }

# Crear un curso
curl -X POST http://localhost:3005/api/v1/courses \
  -H "Content-Type: application/json" \
  -d '{"title":"Testing con Jest","category":"backend","instructor":"Sofia Leon","price":45,"durationHours":10}'
# → 201 { "data": { "id": "...", "title": "Testing con Jest", ... } }

# Body inválido → 400 con issues[]
curl -X POST http://localhost:3005/api/v1/courses -H "Content-Type: application/json" -d '{"price":-5}'
# → 400 { "error": "Validation Error", "message": "...", "issues": [...] }

# Título repetido (viola @unique) → 409
curl -X POST http://localhost:3005/api/v1/courses \
  -H "Content-Type: application/json" \
  -d '{"title":"Testing con Jest","category":"backend","instructor":"Otro","price":10,"durationHours":5}'
# → 409 { "error": "Conflict", "message": "Ya existe un curso con ese title" }

# :id que no es un UUID → 400
curl http://localhost:3005/api/v1/courses/abc
# → 400 { "error": "Validation Error", "message": "...", "issues": [{ "message": "El id debe ser un UUID válido" }] }

# UUID válido pero que no existe → 404
curl http://localhost:3005/api/v1/courses/00000000-0000-0000-0000-000000000000
# → 404 { "error": "Not Found", "message": "Curso no encontrado" }
```

## Logs del seed

```
$ pnpm exec prisma db seed

Environment variables loaded from .env
Running seed command `tsx prisma/seed.ts` ...
Curso listo: Node.js desde Cero (3 lecciones)
Curso listo: React Avanzado (2 lecciones)
Curso listo: Bases de Datos SQL (2 lecciones)
Curso listo: Diseño UX/UI (1 lecciones)
Curso listo: DevOps con Docker (2 lecciones)

The seed command has been executed.
```

Corrido dos veces seguidas, la base sigue en 5 cursos / 10 lecciones — no duplica nada
(usa `upsert` por `title` y por la llave compuesta `[courseId, order]`).

## Decisiones de diseño

- **`Course` sigue siendo el recurso principal**: se mantiene continuidad con las semanas 02-04, solo cambia *dónde* vive el dato (memoria → Postgres).
- **`id` como UUID, no autoincremental**: regla del bootcamp para esta semana — refleja cómo se modelan claves primarias en sistemas distribuidos reales.
- **`title` es `@unique`**: a propósito, para tener un caso real y verificable de conflicto (`P2002` → `409`), tal como pide la rúbrica.
- **`findUniqueOrThrow` en vez de `findUnique` + chequeo manual**: al pedir un curso por id con su relación (`include`), si no existe, Prisma mismo lanza `P2025` — una sola query cubre "traer con relación" y "detectar que no existe".
- **El repository es el único lugar que conoce Prisma**: `mapPrismaError()` (en `errors/prismaError.ts`) traduce los códigos `P2025`/`P2002` a `AppError` ahí mismo — el service y el controller no importan nada de `@prisma/client` para manejo de errores, solo el tipo `Course` para tipar.
- **Sin interfaces duplicadas**: `Course` y `Lesson` no se redefinen en `types.ts` — se usa `import type { Course } from '@prisma/client'`, el tipo que Prisma genera automáticamente desde el schema.
- **`onDelete: Cascade` en `Lesson`**: borrar un curso borra sus lecciones automáticamente, evitando un error de restricción de llave foránea al hacer `DELETE`.
- **Prisma Client como singleton** (`src/lib/prisma.ts`): evita agotar el pool de conexiones de Postgres cuando `tsx watch` reinicia el proceso en cada cambio de archivo durante desarrollo.

---

## 📖 Guía de estudio — cómo funciona por dentro

> Esta sección no es parte del entregable formal, es mi propia referencia para
> repasar el proyecto más adelante.

### La idea del proyecto, en una frase

Las semanas 02-04 guardaban los cursos en un array de JavaScript que se borraba cada vez que
se reiniciaba el servidor; esta semana ese array se reemplaza por una **base de datos de
verdad** (PostgreSQL) y Prisma actúa como "traductor" entre el código TypeScript y el SQL
que la base realmente entiende — nunca escribimos SQL a mano.

### El flujo completo de una petición

```
Cliente: GET /api/v1/courses/<uuid>
        │
        ▼
courses.controller.ts   valida que <uuid> tenga forma de UUID (Zod)
        │
        ▼
courses.service.ts      solo reenvía la llamada al repository
        │
        ▼
courses.repository.ts   prisma.course.findUniqueOrThrow({ where, include: { lessons } })
        │
        ▼
Prisma Client            traduce eso a SQL (un SELECT con JOIN) y lo manda a Postgres
        │
        ▼
Postgres                 ejecuta el SQL, devuelve las filas
        │
        ▼
Prisma Client            arma un objeto Course con un array `lessons` adentro
        │
        ▼
Cliente recibe { data: { ...course, lessons: [...] } }
```

### Qué pasa cuando algo sale mal (P2025 / P2002)

```
POST /api/v1/courses con title repetido
        │
        ▼
courses.repository.ts   prisma.course.create({ data }) → Postgres rechaza el INSERT
        │                (ya existe una fila con ese title, por el @unique)
        ▼
Prisma Client            envuelve ese rechazo en un PrismaClientKnownRequestError
        │                con code = "P2002"
        ▼
errors/prismaError.ts    mapPrismaError() reconoce "P2002" → throw new AppError(409, ...)
        │
        ▼
courses.controller.ts    catch (err) { next(err) }  ← no sabe ni le importa que fue Prisma
        │
        ▼
errorHandler.ts           err instanceof AppError → responde 409 con el mensaje
```

Lo mismo pasa con `P2025` (no encontrado), pero en `findUniqueOrThrow`, `update` o `delete`.

### Por qué el repository "atrapa" el error de Prisma en vez de dejarlo subir tal cual

Si dejáramos que el error de Prisma (`PrismaClientKnownRequestError`, código `P2002`) llegara
directo al `errorHandler`, este tendría que importar `@prisma/client` para reconocerlo —
mezclando la capa HTTP con detalles de la base de datos. Al traducirlo a `AppError` dentro del
`repository` (el único lugar que ya conoce Prisma), el resto de la app solo necesita entender
un tipo de error: `AppError`. Si el día de mañana se cambia Prisma por otro ORM, solo se toca
`courses.repository.ts` y `errors/prismaError.ts` — nada más.

### Archivo por archivo

**`prisma/schema.prisma` — el plano de la base de datos**
Define dos modelos (`Course`, `Lesson`) y la relación entre ellos. Este archivo **no se edita
la base de datos directamente** — cada cambio aquí se convierte en una migración con
`prisma migrate dev`, que genera el SQL real y lo aplica.

**`prisma/migrations/` — el historial de cambios de la base**
Cada carpeta (ej. `20260904185022_init`) es un cambio versionado, con su propio `migration.sql`.
Nunca se editan a mano ni se borran — si algo está mal, se crea una migración *nueva* que lo
corrija, igual que un commit de git no se reescribe, se agrega otro encima.

**`prisma/seed.ts` — datos de arranque**
Usa `upsert` (no `create`) para poder correrse varias veces sin duplicar: "si ya existe un
curso con este título, no hagas nada; si no existe, créalo". Lo mismo para las lecciones, pero
usando la llave compuesta `courseId_order`.

**`src/lib/prisma.ts` — una sola conexión, no una por petición**
Sin este singleton, cada vez que `tsx watch` reinicia el servidor (en cada guardado de
archivo durante desarrollo), se abriría una conexión nueva a Postgres sin cerrar la anterior
— eventualmente Postgres rechaza nuevas conexiones porque se le acabó el límite.

**`src/errors/prismaError.ts` — el traductor de errores de Prisma**
Revisa el `code` del error (`P2025`, `P2002`) y lo convierte al `AppError` correspondiente.
Cualquier otro error de Prisma (uno que no anticipamos) se re-lanza tal cual, y cae en el `500`
genérico del `errorHandler`.

**`src/repositories/courses.repository.ts` — la única capa que llama a Prisma**
`findById` usa `findUniqueOrThrow` con `include: { lessons: ... }` — trae el curso y sus
lecciones en una sola consulta (evita el problema N+1: preguntar primero por el curso, y
*después*, por separado, por sus lecciones). `findAll` usa `skip`/`take` para paginar y
`count()` para el total, en paralelo con `Promise.all`.

**`src/services/courses.service.ts` — mucho más simple que antes**
Ya no valida "¿existe?" a mano — esa responsabilidad ahora vive en el repository (vía
`findUniqueOrThrow` y el manejo de `P2025` en `update`/`delete`). El service solo orquesta:
arma los parámetros de paginación y reenvía las llamadas.

**`src/schemas/courses.schema.ts`** — igual que en semana 04, pero `courseIdSchema` ahora
valida formato de **UUID** (`z.string().uuid()`) en vez de número.

### Conceptos clave para recordar

| Concepto | Qué significa |
|---|---|
| **Migración** | Un archivo SQL versionado que describe *un cambio* en la estructura de la base — se generan con `prisma migrate dev`, nunca se editan a mano |
| **`skip` / `take`** | La forma en que Prisma pagina: `skip` = cuántas filas saltarse, `take` = cuántas traer (equivalente a `OFFSET`/`LIMIT` en SQL) |
| **`include`** | Le dice a Prisma "trae también estos datos relacionados en la misma consulta" — evita el problema N+1 |
| **Problema N+1** | Pedir una lista de N cursos, y luego hacer N consultas adicionales (una por curso) para traer sus lecciones — `include` lo evita trayendo todo en una sola consulta |
| **`P2025`** | Código de Prisma: "esperaba encontrar un registro y no lo encontré" (en `findUniqueOrThrow`, `update`, `delete`) |
| **`P2002`** | Código de Prisma: "se violó una restricción `@unique`" |
| **Singleton de Prisma Client** | Una sola instancia de `PrismaClient` reutilizada en toda la app, para no agotar el pool de conexiones |
| **`onDelete: Cascade`** | Al borrar el registro "padre" (Course), Postgres borra automáticamente sus "hijos" (Lesson) — sin esto, el `DELETE` fallaría por la llave foránea |

### Errores que tuve al montar el entorno (para no repetirlos)

- **Puerto 5432 ocupado**: en mi máquina ya había un PostgreSQL instalado directamente en
  Windows (servicio `postgresql-x64-18`) usando el puerto 5432 — Docker igual "levantaba" el
  contenedor, pero las conexiones se iban al Postgres equivocado y fallaba la autenticación
  con un mensaje confuso (`credentials for (not available) are not valid`). Solución: mapear
  el contenedor a otro puerto del host (`5434:5432` en `docker-compose.yml`) y usar ese puerto
  en `DATABASE_URL`.
- **Puerto 3000 ocupado**: por la misma razón (otro proyecto corriendo), la API se movió a
  `PORT=3005`.
- **Versión de Prisma**: la última versión "estable" que instala `pnpm add prisma` en este
  momento resultó ser una versión de prueba (`8.0.0-rc`) que **ya no soporta** poner
  `url = env("DATABASE_URL")` directo en `schema.prisma` (exige un archivo de configuración
  aparte y "adaptadores" de conexión). Se fijó la versión a `6.19.3` para `prisma` y
  `@prisma/client` (deben ser la **misma versión exacta** entre los dos paquetes).

### Si lo retomo en un mes, lo primero que debo recordar

1. Nunca se edita un archivo dentro de `prisma/migrations/` a mano — si hay que cambiar algo,
   se edita `schema.prisma` y se corre `prisma migrate dev --name <algo>` de nuevo, que crea
   una migración *nueva*.
2. Si agrego un campo `@unique` nuevo y necesito capturar su conflicto, el patrón ya existe en
   `errors/prismaError.ts` — solo hay que asegurarme de que el mensaje sea claro.
3. Cualquier query que traiga una relación (`include`) y pueda no encontrar el registro va con
   `findUniqueOrThrow`, no `findUnique` + `if`.
4. `pnpm exec prisma studio` abre una interfaz visual para ver/editar los datos de la base
   directamente — útil para revisar rápido sin escribir SQL.
