# MongoDB + Mongoose — Cursos Online

Entrega semanal para `bc-expressjs`, semana 06
(ver especificación: [bootcamp/week-06-mongodb_mongoose/3-proyecto](../README.md)).

## Dominio asignado

**Plataforma de cursos online** — recurso principal `Course` (el mismo de semanas anteriores),
ahora persistido en **MongoDB** con Mongoose. Esta semana se agrega el recurso secundario
**`Category`**, referenciado desde `Course` con `ObjectId` + `populate()`.

A diferencia de la semana 05 (PostgreSQL + Prisma, con `Course`/`Lesson`), esta es una
implementación **nueva y separada** en una base de datos NoSQL — el objetivo es comparar
cómo se modela la misma idea de negocio en SQL vs. NoSQL.

## Por qué `Category` como secundaria (y no `Lesson`/`Student`/`Enrollment`)

El profe pide que la entidad secundaria sea el lado "1" de la relación y la principal el
lado "N" (`Course` referencia a `Category`, no al revés) — así son todos sus ejemplos
(`Book→Author`, `Medicine→Supplier`, `Member→Plan`, `Dish→Category`). `Category` además ya
existía como campo de texto libre en `Course` desde la semana 02 — esta semana simplemente
se convierte en una entidad real, con su propio CRUD.

## Diagrama de entidades

```
┌─────────────────────┐          ┌─────────────────────────┐
│      Category         │  1    N │          Course           │
├─────────────────────┤◀─────────├─────────────────────────┤
│ _id      ObjectId PK│          │ _id          ObjectId PK │
│ name    String @unique│          │ title      String @unique │
│ description   String │          │ category  ObjectId (ref) │
│ active       Boolean │          │ instructor        String │
│ createdAt    Date    │          │ price             Number │
│ updatedAt    Date    │          │ durationHours     Number │
└─────────────────────┘          │ active           Boolean │
                                  │ createdAt           Date │
                                  │ updatedAt           Date │
                                  └─────────────────────────┘
```

`Course.category` guarda el `ObjectId` de una `Category`; `.populate('category')` lo
convierte en el objeto completo al leer.

## Cómo correr

```bash
# 1. Levantar MongoDB
docker compose up -d

# 2. Instalar dependencias
pnpm install

# 3. Variables de entorno
cp .env.example .env

# 4. Cargar datos demo (idempotente)
pnpm seed

# 5. Arrancar el servidor
pnpm dev       # http://localhost:3006
pnpm build     # verifica TypeScript estricto
```

> **Nota sobre puertos**: si en tu máquina el `27017` ya está ocupado (por un MongoDB
> instalado directo en Windows, por ejemplo), este proyecto usa `27018` en el host
> (`docker-compose.yml`) y `3006` para la API — cámbialos si hace falta.

## Endpoints

### Category (secundaria) — `/api/v1/categories`

| Método | Ruta | Descripción | Status |
|---|---|---|---|
| GET | `/api/v1/categories` | Listar todas | 200 |
| GET | `/api/v1/categories/:id` | Obtener por id | 200 / 400 / 404 |
| POST | `/api/v1/categories` | Crear | 201 / 400 / 409 |
| PUT | `/api/v1/categories/:id` | Actualizar | 200 / 400 / 404 |
| DELETE | `/api/v1/categories/:id` | Eliminar | 204 / 400 / 404 |

### Course (principal) — `/api/v1/courses`

| Método | Ruta | Descripción | Status |
|---|---|---|---|
| GET | `/api/v1/courses?page&limit` | Listado paginado, **con `category` incluida** | 200 |
| GET | `/api/v1/courses/:id` | Detalle, con `category` incluida | 200 / 400 / 404 |
| POST | `/api/v1/courses` | Crear (valida con Zod + verifica que la categoría exista) | 201 / 400 / 404 / 409 |
| PUT | `/api/v1/courses/:id` | Actualizar | 200 / 400 / 404 / 409 |
| DELETE | `/api/v1/courses/:id` | Eliminar | 204 / 400 / 404 |

También disponible: `GET /health`.

## Ejemplos de request/response

```bash
# Listado paginado (con la categoría de cada curso ya incluida)
curl "http://localhost:3006/api/v1/courses?page=1&limit=2"
# → 200 { "data": [{ ..., "category": { "_id": "...", "name": "backend", ... } }], "total": 5, "page": 1, "totalPages": 3 }

# Crear un curso
curl -X POST http://localhost:3006/api/v1/courses \
  -H "Content-Type: application/json" \
  -d '{"title":"Testing con Jest","category":"<id de una categoría>","instructor":"Sofia Leon","price":45,"durationHours":10}'
# → 201

# Body inválido → 400 con issues[]
curl -X POST http://localhost:3006/api/v1/courses -H "Content-Type: application/json" -d '{"price":-5}'

# Título repetido (viola índice @unique) → 409
curl -X POST http://localhost:3006/api/v1/courses \
  -H "Content-Type: application/json" \
  -d '{"title":"Testing con Jest","category":"<id>","instructor":"Otro","price":10,"durationHours":5}'
# → 409 { "error": "Conflict", "message": "Ya existe un registro con ese title" }

# Categoría con formato válido pero que no existe → 404
curl -X POST http://localhost:3006/api/v1/courses \
  -H "Content-Type: application/json" \
  -d '{"title":"Curso Fantasma","category":"000000000000000000000000","instructor":"X","price":10,"durationHours":5}'
# → 404 { "error": "Not Found", "message": "Categoría no encontrada" }

# :id que no es un ObjectId → 400
curl http://localhost:3006/api/v1/courses/abc
# → 400 { "error": "Validation Error", "issues": [{ "message": "El id debe ser un ObjectId válido" }] }

# ObjectId válido pero que no existe → 404
curl http://localhost:3006/api/v1/courses/000000000000000000000000
# → 404 { "error": "Not Found", "message": "Curso no encontrado" }
```

## Logs del seed

```
$ pnpm seed

Categoría lista: backend
Categoría lista: frontend
Categoría lista: data
Categoría lista: design
Categoría lista: devops
Curso listo: Node.js desde Cero
Curso listo: React Avanzado
Curso listo: Bases de Datos NoSQL
Curso listo: Diseño UX/UI
Curso listo: DevOps con Docker
```

Corrido dos veces seguidas, la base sigue en 5 categorías / 5 cursos — no duplica nada
(usa `findOneAndUpdate` con `upsert: true` sobre los campos `@unique`).

## Decisiones de diseño

- **`Category` como secundaria, `Course` sigue de principal**: mantiene la misma dirección de referencia que todos los ejemplos del profe (secundaria = "1", principal = "N" con la `ref`).
- **El service verifica que la categoría exista antes de crear/actualizar un curso**: Mongoose no valida por sí solo que un `ObjectId` referenciado exista de verdad — sin este chequeo, se podrían crear cursos "huérfanos" apuntando a categorías inexistentes.
- **`.lean()` en todas las lecturas**: devuelve objetos JavaScript planos en vez de instancias completas de Mongoose (con métodos, getters, etc.) — más rápido y es justo lo que necesita una API que solo lee para responder JSON.
- **Errores de Mongoose traducidos en un solo lugar** (`errors/mongooseError.ts`): igual que con Prisma en la semana 05, ni el service ni el controller conocen `CastError` ni el código `11000` — solo `AppError`.
- **`findByIdAndUpdate`/`findOneAndUpdate` con `returnDocument: 'after'`** (no `new: true`, que Mongoose 9 marca obsoleto): para que la respuesta traiga el documento ya actualizado, no el anterior.
- **`connectDB()` una sola vez en `server.ts`, antes de `app.listen()`**: nunca dentro de una ruta o repository — abrir una conexión nueva en cada petición agotaría los recursos de Mongo rápidamente.
- **Sin interfaces duplicadas**: los tipos de `Course` y `Category` se infieren de sus propios schemas con `InferSchemaType`, no se redefinen a mano en `types.ts`.

---

## 📖 Guía de estudio — cómo funciona por dentro

> Esta sección no es parte del entregable formal, es mi propia referencia para
> repasar el proyecto más adelante.

### La idea del proyecto, en una frase

La semana 05 modeló esta misma plataforma de cursos con tablas y llaves foráneas
(PostgreSQL); esta semana se modela con **documentos** (MongoDB) — cada curso es un
"papel" independiente que solo *apunta* al id de su categoría, en vez de vivir todos en
una tabla rígida con columnas fijas.

### El flujo completo de una petición con `populate()`

```
Cliente: GET /api/v1/courses/<id>
        │
        ▼
course.controller.ts     valida que <id> tenga forma de ObjectId (Zod)
        │
        ▼
course.service.ts        reenvía la llamada al repository
        │
        ▼
course.repository.ts     Course.findById(id).populate('category').lean()
        │
        ▼
Mongoose                  1) busca el curso por _id
                          2) ve que category = ObjectId("...")
                          3) hace una SEGUNDA consulta a la colección `categories`
                             buscando ese _id, y reemplaza el ObjectId por el
                             documento completo antes de devolver el resultado
        │
        ▼
Cliente recibe { data: { ...curso, category: { _id, name, description, ... } } }
```

### Qué pasa cuando algo sale mal (CastError / 11000)

```
POST /api/v1/courses con title repetido
        │
        ▼
course.repository.ts    Course.create(dto) → Mongo rechaza el insert
        │                (ya existe un documento con ese title, por el índice unique)
        ▼
Driver de Mongo          lanza un MongoServerError con code = 11000
        │
        ▼
errors/mongooseError.ts  mapMongooseError() reconoce el código 11000 → throw AppError(409, ...)
        │
        ▼
course.controller.ts     catch (err) { next(err) }
        │
        ▼
errorHandler.ts           err instanceof AppError → responde 409
```

Con un `:id` mal formado (ej. `"abc"`) pasa algo parecido, pero el error es un
`CastError` (Mongoose no logra convertir `"abc"` a un `ObjectId` válido) — se captura
igual en `mapMongooseError()` y se traduce a `400`.

### Por qué `Category` necesita su propio CRUD completo (y `Lesson` en la semana 05 no)

En la semana 05, `Lesson` solo se creaba vía el seed — no tenía rutas propias, porque el
profe solo pedía **ver** la relación (`include` en el detalle). Esta semana el profe pide
explícitamente que la entidad secundaria tenga **GET/POST/PUT/DELETE propios**
(`/api/v1/categories`) — como si fuera un catálogo administrable por separado (agregar una
categoría nueva sin tener que crear un curso). Por eso `Category` sí tiene controller,
service, repository y rutas completas, igual que `Course`.

### Archivo por archivo

**`models/category.model.ts` / `models/course.model.ts` — el schema es el modelo**
A diferencia de Prisma (donde el `schema.prisma` es un archivo aparte que genera código),
en Mongoose el schema **es** código TypeScript normal — `new Schema({...})` define los
campos, tipos y validadores directamente, y `InferSchemaType` saca el tipo de TypeScript
de ahí mismo.

**`config/db.ts` — la conexión, una sola vez**
`connectDB()` se llama una única vez al arrancar el servidor (`server.ts`), antes de
`app.listen()`. Si `connectDB()` fallara (Mongo apagado, URI mal escrita), el servidor
nunca llega a levantarse — mejor eso que arrancar "a medias" y fallar en la primera
petición real.

**`errors/mongooseError.ts` — el traductor de errores de Mongo**
Revisa dos casos: `CastError` (formato de id inválido) → 400, y código `11000` (índice
`unique` violado) → 409. Cualquier otro error se re-lanza tal cual, y cae en el 500
genérico del `errorHandler`.

**`repositories/course.repository.ts` — la única capa que usa `Course` (el modelo)**
`findAll` usa `.skip()`/`.limit()` para paginar y `Course.countDocuments()` para el total,
en paralelo con `Promise.all`. `findById` usa `.populate('category')` para traer la
categoría completa en la misma respuesta.

**`services/course.service.ts` — la regla de negocio que Mongoose no da gratis**
Antes de crear o actualizar un curso, pregunta `categoryService.findById(dto.category)`
— si esa categoría no existe, lanza un 404 **antes** de intentar guardar el curso. Sin
este chequeo, Mongoose guardaría el curso igual, con una referencia que apunta a la nada.

### Conceptos clave para recordar

| Concepto | Qué significa |
|---|---|
| **Documento vs. fila** | En MongoDB cada registro es un documento independiente (como un JSON); no vive en una tabla con columnas fijas para todos por igual |
| **`ObjectId`** | El identificador único de Mongo — un valor de 12 bytes (24 caracteres hex), no un número autoincremental |
| **`ref` + `populate()`** | `ref: 'Category'` le dice a Mongoose a qué colección apunta el `ObjectId`; `.populate('campo')` hace la segunda consulta y reemplaza el id por el documento completo |
| **`.lean()`** | Devuelve un objeto JS plano en vez de un documento "vivo" de Mongoose (sin métodos como `.save()`) — más rápido para solo leer y responder JSON |
| **`CastError`** | Error que lanza Mongoose cuando el valor no tiene el tipo/formato esperado (ej. un `:id` que no es un `ObjectId` válido) |
| **Código `11000`** | Código de error del driver de Mongo para "violaste un índice `unique`" |
| **`{ timestamps: true }`** | Le agrega automáticamente `createdAt`/`updatedAt` a cada documento, sin tener que escribirlos a mano |
| **Por qué Mongo no tiene migraciones** | No hay una estructura de tabla fija que "migrar" — cada documento puede (en teoría) tener campos distintos; el schema de Mongoose es una capa de validación en la aplicación, no una restricción impuesta por la base de datos como en SQL |

### Si lo retomo en un mes, lo primero que debo recordar

1. `Course.category` guarda un `ObjectId`, no el nombre de la categoría — para mostrar el
   nombre hay que usar `.populate('category')`, si no, solo se ve el id en crudo.
2. Cualquier query que dependa de mostrar datos "en crudo" para la API (no para seguir
   encadenando operaciones de Mongoose) debería llevar `.lean()` al final.
3. Si agrego una regla nueva de "esto no se puede borrar si tiene tal otra cosa asociada"
   (ej. no borrar una categoría con cursos activos), va en el `service`, como el chequeo de
   "la categoría debe existir" que ya está en `course.service.ts`.
4. Los errores de Mongo (`CastError`, `11000`) siempre pasan por
   `errors/mongooseError.ts` — si aparece un código nuevo que hay que manejar, se agrega
   ahí, no en cada repository por separado.
