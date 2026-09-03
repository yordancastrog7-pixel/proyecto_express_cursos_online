# Validación, Errores y Logging — Cursos Online

Entrega semanal para `bc-expressjs`, semana 04
(ver especificación: [bootcamp/week-04-validacion_error_handling/3-proyecto](../README.md)).

## Dominio asignado

**Plataforma de cursos online** — recurso `Course` (`title`, `category`, `instructor`, `price`, `durationHours`, `active`, `createdAt`), el mismo de la semana 03, ahora con validación, errores estructurados y logging.

## Cómo correr

```bash
pnpm install
cp .env.example .env
pnpm dev       # arranca el servidor en http://localhost:3000
pnpm build     # verifica TypeScript estricto
```

## Qué se agregó esta semana sobre la arquitectura de la semana 03

```
routes → controllers → services → repositories
              │             │
              │             └─ lanza AppError(404, ...) si el curso no existe
              └─ valida con Zod (.safeParse en body, .parse en :id)
```

| Capa nueva | Responsabilidad |
|---|---|
| `schemas/` | Reglas de validación de entrada con Zod (`createCourseSchema`, `updateCourseSchema`, `courseIdSchema`) |
| `errors/` | Clase `AppError` — errores HTTP propios del dominio (`statusCode`, `isOperational`) |
| `middlewares/notFound.ts` | 404 para rutas que no existen |
| `middlewares/errorHandler.ts` | Middleware de 4 parámetros que centraliza **toda** respuesta de error |
| `config/logger.ts` | Winston (niveles por entorno) + stream para que Morgan registre cada petición HTTP |

## Campos del schema y sus validaciones

| Campo | Regla | Mensaje si falla |
|---|---|---|
| `title` | string, no vacío | "El título es obligatorio" |
| `category` | string, no vacío | "La categoría es obligatoria" |
| `instructor` | string, no vacío | "El instructor es obligatorio" |
| `price` | número positivo | "El precio debe ser mayor a 0" |
| `durationHours` | entero positivo | "La duración debe ser un número entero de horas" / "...mayor a 0" |
| `active` | boolean, opcional (default `true`) | — |

`updateCourseSchema` es `createCourseSchema.partial()` — mismas reglas, todos los campos opcionales.
El `:id` de la URL se valida con `z.coerce.number().int().positive()` — si no es un entero positivo, responde `400` antes de tocar el service.

## Endpoints

| Método | Ruta | Descripción | Status |
|---|---|---|---|
| GET | `/api/v1/courses?page&limit` | Listar con paginación | 200 |
| GET | `/api/v1/courses/:id` | Obtener por ID | 200 / 400 / 404 |
| POST | `/api/v1/courses` | Crear (valida con Zod) | 201 / 400 |
| PUT | `/api/v1/courses/:id` | Actualizar (campos opcionales) | 200 / 400 / 404 |
| DELETE | `/api/v1/courses/:id` | Eliminar | 204 / 400 / 404 |

También disponible: `GET /health`.

## Contratos de respuesta

```json
// GET /courses?page=1&limit=2 → 200
{ "data": [...], "total": 4, "page": 1, "limit": 2 }

// POST /courses (body inválido) → 400
{
  "error": "Validation Error",
  "message": "Los datos enviados no son válidos",
  "issues": [
    { "path": "title", "message": "El título es obligatorio" },
    { "path": "price", "message": "El precio debe ser mayor a 0" }
  ]
}

// GET /courses/abc (id no numérico) → 400
{ "error": "Validation Error", "message": "Los datos enviados no son válidos", "issues": [...] }

// GET /courses/999 (no existe) → 404
{ "error": "Not Found", "message": "Course 999 not found" }

// GET /ruta-que-no-existe → 404
{ "error": "Not Found", "message": "Route GET /ruta-que-no-existe not found" }
```

## Ejemplo de uso (curl)

```bash
# Body inválido → 400 con issues[]
curl -X POST http://localhost:3000/api/v1/courses \
  -H "Content-Type: application/json" \
  -d '{"price":-5}'

# Crear válido → 201
curl -X POST http://localhost:3000/api/v1/courses \
  -H "Content-Type: application/json" \
  -d '{"title":"DevOps con Docker","category":"devops","instructor":"Pedro Ibarra","price":79.99,"durationHours":16}'

# id no numérico → 400
curl http://localhost:3000/api/v1/courses/abc

# id inexistente → 404
curl http://localhost:3000/api/v1/courses/999

# Ruta inexistente → 404 (formato JSON, no HTML)
curl http://localhost:3000/api/v1/no-existe

# Actualizar parcial
curl -X PUT http://localhost:3000/api/v1/courses/2 \
  -H "Content-Type: application/json" \
  -d '{"price":29.99}'

# Eliminar
curl -X DELETE http://localhost:3000/api/v1/courses/1
```

## Decisiones de diseño

- **`.safeParse()` en el body, `.parse()` en el `:id`**: el body necesita un formato de respuesta 400 propio (`issues[]`) que el controller arma a mano; el `:id` está dentro de un `try/catch` que ya reenvía cualquier error a `next(err)`, así que dejar que `.parse()` lance y caiga en el `errorHandler` es más simple y sigue siendo seguro (no revienta el proceso).
- **El service lanza `AppError`, no el controller**: decidir "si el recurso existe" es una regla de negocio, no de HTTP — por eso `findById` en `courses.service.ts` lanza `AppError(404, ...)` y el controller solo se entera vía `catch`.
- **`errorHandler` con exactamente 4 parámetros**: Express solo reconoce un middleware como manejador de errores si su función tiene 4 parámetros (`err, req, res, next`), aunque `next` no se use — quitarlo rompe el mecanismo silenciosamente.
- **`notFound` antes de `errorHandler`, ambos después de las rutas**: si una petición no matchea ninguna ruta, cae en `notFound` (que responde 404); cualquier error lanzado en el camino cae en `errorHandler`. El orden en `app.ts` importa.
- **Winston con nivel según entorno**: `http` en desarrollo (para ver cada petición vía Morgan) y `warn` en producción (para no llenar los logs de ruido); el archivo `logs/error.log` solo se escribe en producción.
- **Stack trace condicional**: el `errorHandler` solo agrega `stack` a la respuesta 500 si `NODE_ENV !== 'production'` — en producción no se filtran detalles internos al cliente.

---

## 📖 Guía de estudio — cómo funciona por dentro

> Esta sección no es parte del entregable formal, es mi propia referencia para
> repasar el proyecto más adelante.

### La idea del proyecto, en una frase

La semana 03 ya tenía "departamentos" (routes → controllers → services → repositories); esta semana le agregamos **seguridad de entrada** (nadie pasa sin que Zod revise sus papeles en la puerta), **un protocolo único para reportar problemas** (`AppError` + `errorHandler`, en vez de que cada función invente su propio mensaje de error), y **una bitácora** (Winston/Morgan, que anota quién entró y qué salió mal).

### El flujo completo de una petición con error

```
Cliente envía POST /api/v1/courses con body inválido
        │
        ▼
courses.controller.ts   createCourseSchema.safeParse(req.body) → success: false
        │
        ▼
        (el controller arma la respuesta 400 él mismo, con zodErrorToResponse)
        │
        ▼
Cliente recibe { error, message, issues[] }
```

```
Cliente envía GET /api/v1/courses/999 (no existe)
        │
        ▼
courses.controller.ts   id = courseIdSchema.parse("999") → 999 (válido)
        │
        ▼
courses.service.ts      findById(999) → repo no lo encuentra → throw new AppError(404, ...)
        │
        ▼
courses.controller.ts   catch (err) { next(err) }  ← el controller NO decide nada, solo reenvía
        │
        ▼
errorHandler.ts          err instanceof AppError → responde con err.statusCode y el mensaje
        │
        ▼
Cliente recibe { error: "Not Found", message: "Course 999 not found" }
```

### Por qué un error handler centralizado y no `try/catch` con `res.status()` en cada función

En la semana 03, cada función del controller decidía su propio 404 (`if (!course) { res.status(404).json(...) }`). Funcionaba, pero repetía la misma lógica 3 veces (`getById`, `update`, `remove`) y mezclaba "¿existe el recurso?" (una decisión de negocio) con "¿cómo se ve una respuesta 404?" (un detalle de HTTP). Centralizarlo en `errorHandler` significa:
- Si mañana cambia el formato de las respuestas de error, se edita en **un solo archivo**.
- El controller y el service quedan más simples: solo lanzan o dejan pasar el error, nunca arman la respuesta HTTP de error a mano (excepto la validación del body, que sí necesita un shape propio con `issues[]`).
- Cualquier error no anticipado (un bug real) también queda cubierto automáticamente por el `else` genérico → 500, en vez de crashear el servidor.

### Archivo por archivo

**`schemas/courses.schema.ts` — el "papeleo" de entrada**
- `createCourseSchema`: define qué es un curso válido. Cada campo tiene su propio mensaje de error en español, tanto para "falta el campo" (`{ error: '...' }` en el constructor del tipo) como para "el valor no cumple la regla" (`.min()`, `.positive()`, etc.) — sin esto, Zod usa mensajes en inglés por defecto.
- `updateCourseSchema`: `createCourseSchema.partial()` — reutiliza las mismas reglas sin duplicar código, solo que ningún campo es obligatorio.
- `courseIdSchema`: valida el `:id` que llega como **string** desde la URL; `z.coerce.number()` primero lo convierte a número y luego valida que sea entero positivo.
- `CreateCourseDto` / `UpdateCourseDto`: no se escriben a mano, se infieren del schema con `z.infer<typeof createCourseSchema>` — un solo lugar de verdad entre la validación y el tipo de TypeScript.

**`errors/AppError.ts` — el "formulario oficial" de un error**
- Extiende la clase nativa `Error` y le agrega `statusCode` (qué HTTP status usar) e `isOperational` (¿es un error esperado como un 404, o un bug real?).
- `Object.setPrototypeOf(this, AppError.prototype)` es necesario en TypeScript al extender clases nativas — sin esto, `instanceof AppError` podría fallar en ciertos casos.

**`middlewares/errorHandler.ts` — el "departamento de reclamos" centralizado**
- Revisa el error en orden: ¿es un `ZodError` (falló la validación)? → 400. ¿Es un `AppError` (regla de negocio, ej. 404)? → su propio `statusCode`. ¿Es cualquier otra cosa? → 500 genérico, con el stack trace visible solo fuera de producción.
- También exporta `zodErrorToResponse()`, una función compartida que usan tanto este archivo (para el `:id` inválido) como el controller (para el body inválido) — así el formato `{ error, message, issues[] }` es idéntico en ambos casos.

**`middlewares/notFound.ts` — el "no encontré esa oficina"**
Se registra después de todas las rutas (`app.use('/api/v1/courses', ...)`) y antes del `errorHandler`. Si una petición llega hasta aquí, ninguna ruta anterior coincidió.

**`config/logger.ts` — la bitácora**
- Winston con dos "perfiles": en desarrollo, colores y timestamp corto en consola (nivel hasta `http`, o sea también registra cada petición); en producción, formato JSON (más fácil de procesar por herramientas externas) y nivel `warn` (menos ruido).
- `morganStream`: un objeto con un método `.write()` — es el "adaptador" que le permite a Morgan (que no sabe nada de Winston) mandarle cada línea de petición HTTP a `logger.http()`.

**`courses.service.ts` — ahora también decide *cuándo* fallar**
La única diferencia real con la semana 03: en vez de `return undefined` cuando el curso no existe, ahora hace `throw new AppError(404, ...)`. Esto simplifica los controllers, que ya no necesitan un `if (!course) { ... }` en cada función.

**`courses.controller.ts` — extraer → validar → llamar service → responder**
Un paso más que en la semana 03: antes de llamar al service, valida con Zod. En `create`/`update` arma la respuesta 400 a mano (porque necesita el formato con `issues[]`); en el resto, confía en que cualquier error (de validación o de negocio) llegue a `next(err)`.

**`app.ts`** — el orden de los `app.use()` ahora es crítico: primero `express.json()` y `morgan`, luego las rutas, luego `notFound`, y **al final** `errorHandler`. Invertir ese orden rompe el manejo de errores.

### Conceptos clave para recordar

| Concepto | Qué significa |
|---|---|
| **`.parse()` vs `.safeParse()`** | `.parse()` lanza una excepción si falla (hay que envolverlo en `try/catch`); `.safeParse()` nunca lanza, devuelve `{ success, data \| error }` — se elige según si quiero manejar el error yo mismo o dejar que suba |
| **`AppError.isOperational`** | Distingue errores "esperados" (ej. un 404 porque el usuario pidió algo que no existe) de bugs reales del programa — útil para saber si el proceso puede seguir corriendo con seguridad |
| **Middleware de 4 parámetros** | La única forma en que Express reconoce una función como manejador de errores; con 3 parámetros o menos, Express la trata como middleware normal y nunca la llama para errores |
| **`next(err)`** | Le dice a Express "esto falló, sáltate el resto de la cadena normal y ve directo al error handler" |
| **Nivel de log (`http`, `warn`, `error`)** | Cada nivel de Winston tiene una prioridad; configurar `level: 'warn'` significa que solo se registran `warn` y `error`, no `info` ni `http` — así se controla cuánto ruido hay en producción |
| **Stream de Morgan** | Morgan por defecto escribe a la consola directamente; darle un `stream` personalizado permite redirigir esas líneas a través de Winston en vez de `console.log` |

### Si lo retomo en un mes, lo primero que debo recordar

1. Si necesito una nueva regla de "esto no está permitido" (ej. "no crear un curso con más de 200 horas"), va como `.max(200, '...')` en el schema si es sobre el *formato* del dato, o como `throw new AppError(...)` en el `service` si es una *regla de negocio* que depende de otros datos (ej. "no se puede borrar un curso con estudiantes inscritos").
2. El controller **nunca** debe tener un `if (!recurso) { res.status(404)... }` — eso ahora vive en el `service`, que lanza `AppError`.
3. Cualquier `catch` en un controller debe terminar en `next(err)`, nunca en `res.status(500).json(...)` a mano — si no, el error se le escapa al `errorHandler` centralizado.
4. Todo mensaje de Zod que se vea en inglés es porque falta el `{ error: '...' }` en el constructor del tipo (`z.string({ error: '...' })`), no solo en `.min()`/`.max()`.
