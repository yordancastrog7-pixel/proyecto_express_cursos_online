# API REST con Arquitectura en Capas — Cursos Online
 
Entrega semanal para `bc-expressjs`, semana 03
(ver especificación: [bootcamp/week-03-rest_api_arquitectura/3-proyecto/starter](../README.md)).
 
## Dominio asignado
 
**Plataforma de cursos online** — recurso `Course` (`title`, `category`, `instructor`, `price`, `durationHours`, `active`, `createdAt`).
 
## Cómo correr
 
```bash
pnpm install
pnpm dev       # arranca el servidor en http://localhost:3000
pnpm build     # verifica TypeScript estricto
```
 
## Arquitectura
 
```
routes → controllers → services → repositories
```
 
| Capa | Responsabilidad |
|---|---|
| `routes` | Solo mapea URL + método HTTP → función del controller |
| `controllers` | 3 pasos: extraer → llamar service → responder (sin lógica de negocio) |
| `services` | Lógica de negocio, paginación, validaciones — cero imports de Express |
| `repositories` | Único punto de acceso al store en memoria, todos los métodos `async` |
 
## Endpoints
 
| Método | Ruta | Descripción | Status |
|---|---|---|---|
| GET | `/api/v1/courses?page&limit` | Listar con paginación | 200 |
| GET | `/api/v1/courses/:id` | Obtener por ID | 200 / 404 |
| POST | `/api/v1/courses` | Crear nuevo curso | 201 |
| PUT | `/api/v1/courses/:id` | Actualizar curso | 200 / 404 |
| DELETE | `/api/v1/courses/:id` | Eliminar curso | 204 / 404 |
 
También disponible: `GET /health`.
 
## Contratos de respuesta
 
```json
// GET /courses?page=1&limit=5 → 200
{ "data": [...], "total": 4, "page": 1, "limit": 5 }
 
// GET /courses/1 → 200
{ "data": { "id": 1, "title": "...", ... } }
 
// POST /courses → 201
{ "data": { "id": 5, ... } }
 
// GET /courses/999 → 404
{ "error": "Not Found", "message": "Course 999 not found" }
```
 
## Decisiones de diseño
 
- **Repository con copias defensivas**: `findAll`/`findById`/`create`/`update` siempre retornan copias (`{ ...course }`, `[...store]`), nunca la referencia interna del array — así nadie fuera de esta capa puede mutar los datos por accidente.
- **Service sin Express**: ningún archivo de `services/` importa `Request`/`Response`/`NextFunction` — la lógica de negocio queda desacoplada del framework HTTP.
- **Controller de 3 pasos**: cada función sigue el patrón extraer → llamar service → responder, delegando toda decisión de negocio (incluida la existencia del recurso) al service.
- **Paginación**: `page` y `limit` llegan por query string (`?page=1&limit=10`), con valores por defecto `1` y `10` si no se especifican.
- **Datos iniciales**: el repository arranca con 4 cursos de ejemplo (no vacío), para poder probar `GET`/`PUT`/`DELETE` sin necesidad de un `POST` previo.
## Ejemplo de uso (curl)
 
```bash
# Listar con paginación
curl "http://localhost:3000/api/v1/courses?page=1&limit=2"
 
# Crear
curl -X POST http://localhost:3000/api/v1/courses \
  -H "Content-Type: application/json" \
  -d '{"title":"DevOps con Docker","category":"devops","instructor":"Pedro Ibarra","price":79.99,"durationHours":16,"active":true}'
 
# Obtener por ID
curl http://localhost:3000/api/v1/courses/1
 
# Actualizar
curl -X PUT http://localhost:3000/api/v1/courses/1 \
  -H "Content-Type: application/json" \
  -d '{"price":29.99}'
 
# Eliminar
curl -X DELETE http://localhost:3000/api/v1/courses/1
```
 
---
 
## 📖 Guía de estudio — cómo funciona por dentro
 
> Esta sección no es parte del entregable formal, es mi propia referencia para
> repasar el proyecto más adelante.
 
### La idea del proyecto, en una frase
 
Es la misma "recepción" de la semana 2, pero ahora dividida en departamentos: la
persona en la puerta (**routes**) solo dirige a la gente al departamento correcto; el
que atiende en el mostrador (**controller**) solo toma la solicitud y da la respuesta,
sin decidir nada por su cuenta; quien realmente decide qué hacer (**service**) aplica
las reglas del negocio; y el archivista al fondo (**repository**) es el único que toca
los archiveros reales (los datos).
 
### El flujo completo, petición por petición
 
```
Cliente (Thunder Client / curl)
        │
        ▼
  courses.routes.ts      URL + método → función del controller
        │
        ▼
courses.controller.ts    extraer datos de la petición → llamar al service → responder
        │
        ▼
 courses.service.ts      aplica paginación / reglas de negocio → llama al repository
        │
        ▼
courses.repository.ts    única capa que toca el array en memoria
        │
        ▼
 (la respuesta sube por el mismo camino, capa por capa, hasta el cliente)
```
 
### Por qué separar en 4 capas y no dejarlo todo junto (como semana 2)
 
En la semana 2 todo vivía en `courses.routes.ts` — funcionaba, pero mezclaba tres
responsabilidades distintas en un solo archivo. Separar en capas trae ventajas
concretas:
- Si mañana cambias de Express a otro framework, solo reescribes `routes` y
  `controllers` — `services` y `repositories` no se tocan.
- Si mañana cambias el array en memoria por una base de datos real, solo reescribes
  `repositories` — nadie más se entera del cambio.
- Cada capa se puede probar por separado (por ejemplo, probar `service` sin necesidad
  de levantar un servidor HTTP).
### Archivo por archivo
 
**`types.ts` — el contrato de datos, ahora con contratos de respuesta**
Además de `Course`, `CreateCourseDto` y `UpdateCourseDto` (igual que semana 2), esta
semana se agregan tipos genéricos para las respuestas: `SingleResponse<T>`,
`PaginatedResponse<T>` y `ErrorResponse` — así todas las respuestas de la API siguen
siempre la misma forma, sin improvisar caso por caso.
 
**`courses.repository.ts` — el archivista**
- Todos sus métodos son `async` y retornan `Promise<...>`, aunque hoy trabajen sobre
  un simple array (esto prepara el código para el día que se conecte una base de datos
  real, que sí necesita `async/await` de verdad).
- Cada método que retorna un curso hace una **copia defensiva** (`{ ...course }`) en
  vez de devolver la referencia original — así, aunque alguien modifique el objeto que
  recibió, el array interno queda protegido.
**`courses.service.ts` — quien decide**
- `findAll` es donde vive la lógica de paginación: pide todo al repository, y luego
  recorta el array con `.slice(start, start + limit)` — el repository no sabe nada de
  páginas, solo entrega todo.
- `update` y `remove` primero preguntan `findById` antes de actuar — así el service
  decide si el recurso existe (regla de negocio), y el controller solo traduce esa
  decisión a un status HTTP.
- Ningún import de Express aquí — si lo necesitas, es señal de que esa lógica debería
  estar en el controller, no en el service.
**`courses.controller.ts` — el mostrador**
Cada función sigue exactamente 3 pasos:
1. Extraer datos de la petición (`req.params`, `req.query`, `req.body`)
2. Llamar a la función correspondiente del service
3. Responder con el status code y el contrato correcto (`{ data }`, `{ error, message }`)
El controller nunca decide *si* algo existe — solo *traduce* la respuesta del
service (`undefined` → `404`) a HTTP.
 
**`courses.routes.ts` — el directorio**
El archivo más simple de los cuatro: solo listas de `router.metodo(ruta, controller.funcion)`,
sin ninguna otra lógica.
 
**`app.ts` / `server.ts`** — casi idénticos a la semana 2, con la diferencia de que
ahora `app.ts` exporta con `export default app` (en vez de `export function createApp()`),
y el error handler usa el contrato `ErrorResponse` en vez de un objeto genérico.
 
### Conceptos clave para recordar
 
| Concepto | Qué significa |
|---|---|
| **Arquitectura en capas** | Dividir responsabilidades en niveles, cada uno solo habla con el nivel adyacente |
| **DTO vs. contrato de respuesta** | El DTO describe qué *entra* (`CreateCourseDto`); el contrato de respuesta describe qué *sale* (`SingleResponse`, `PaginatedResponse`) |
| **Copia defensiva** | Retornar `{ ...obj }` o `[...arr]` en vez de la referencia original, para evitar mutaciones accidentales desde fuera |
| **Paginación (`page`/`limit`)** | `start = (page - 1) * limit`, luego `.slice(start, start + limit)` sobre el array completo |
| **`total` en la paginación** | Siempre es el conteo del array **completo**, no de la página actual — así el cliente sabe cuántas páginas hay en total |
| **Separación por capas vs. carpetas** | No es solo organizar archivos en carpetas — es que cada capa *no debe saber* cómo funciona la capa que no es su vecina directa (ej. `routes` no debería llamar a `repository` directamente) |
 
### Errores que tuve al montar el entorno (para no repetirlos)
 
- **`is not a module`** al compilar: significa que un archivo no tiene ningún `import`/`export` — casi siempre porque **el archivo no se guardó** después de pegar el contenido. Revisar `Ctrl+S` en todos los archivos antes de correr `pnpm build`.
- Después de ese error, el archivo quedó vacío para TypeScript aunque visualmente el editor mostrara contenido — guardar resolvió todo.
- Si `pnpm dev` queda "colgado" de un intento anterior y Windows pregunta `¿Desea terminar el trabajo por lotes (S/N)?`, responder `S` para liberarlo antes de volver a correr.
### Si lo retomo en un mes, lo primero que debo recordar
 
1. El flujo siempre va en una sola dirección: `routes → controller → service → repository`, nunca al revés ni saltando capas.
2. Si necesito agregar una regla de negocio nueva (ej. "no permitir crear un curso con precio negativo"), va en `service`, no en `controller` ni en `repository`.
3. La paginación vive en el `service`, no en el `repository` — el repository siempre entrega todo, quien recorta es el service.
4. Todos los métodos del repository son `async`, aunque hoy no haya nada realmente asíncrono — es preparación para cuando haya una base de datos real.
 