# Servidor Express con CRUD completo — Cursos Online

Entrega semanal para `bc-expressjs`, semana 02
(ver especificación: [bootcamp/week-02-express_intro/3-proyecto/starter](../README.md)).

## Dominio asignado

**Plataforma de cursos online** — recurso `Course` (`title`, `category`, `instructor`, `price`, `durationHours`, `active`).

## Cómo correr

```bash
pnpm install
pnpm dev       # arranca el servidor en http://localhost:3000
pnpm build     # verifica TypeScript estricto
```

## Endpoints

| Método | Ruta | Descripción | Status |
|---|---|---|---|
| GET | `/api/v1/courses` | Listar todos los cursos | 200 |
| GET | `/api/v1/courses/:id` | Obtener un curso por ID | 200 / 404 |
| POST | `/api/v1/courses` | Crear un nuevo curso | 201 |
| PUT | `/api/v1/courses/:id` | Actualizar un curso completo | 200 / 404 |
| DELETE | `/api/v1/courses/:id` | Eliminar un curso | 204 / 404 |

También disponible: `GET /health` para verificar que el servidor está activo.

## Decisiones de diseño

- **Store en memoria** (`store.ts`): sin base de datos, los datos se pierden al reiniciar el servidor (se incorporará persistencia a partir de la semana 5).
- **Middlewares en orden**: `express.json()` → logger personalizado → rutas → 404 handler → error handler global (siempre al final).
- **Logger personalizado**: registra método, URL, status code y tiempo de respuesta de cada petición, usando el evento `res.on('finish', ...)` para capturar el status real ya generado.
- **Graceful shutdown**: el servidor atiende `SIGTERM` y `SIGINT`, cerrando conexiones en curso antes de terminar el proceso.
- **DTOs con `Omit`/`Partial`**: `CreateCourseDto` excluye el `id` (se genera automáticamente); `UpdateCourseDto` hace todos los campos opcionales para permitir actualizaciones parciales.

## Ejemplo de uso (curl)

```bash
# Listar
curl http://localhost:3000/api/v1/courses

# Crear
curl -X POST http://localhost:3000/api/v1/courses \
  -H "Content-Type: application/json" \
  -d '{"title":"Node.js desde Cero","category":"backend","instructor":"Ana Torres","price":49.99,"durationHours":12,"active":true}'

# Obtener por ID
curl http://localhost:3000/api/v1/courses/1

# Actualizar
curl -X PUT http://localhost:3000/api/v1/courses/1 \
  -H "Content-Type: application/json" \
  -d '{"price":39.99}'

# Eliminar
curl -X DELETE http://localhost:3000/api/v1/courses/1
```

---

## 📖 Guía de estudio — cómo funciona por dentro

> Esta sección no es parte del entregable formal, es mi propia referencia para
> repasar el proyecto más adelante.

### La idea del proyecto, en una frase

Es la "recepción" de la academia online: cualquiera puede tocar la puerta (hacer una
petición HTTP) y pedir ver el catálogo, agregar un curso, cambiar sus datos o
eliminarlo. La recepción (el servidor) siempre responde algo — nunca deja a nadie sin
respuesta, ni se cae si alguien pregunta por un curso que no existe.

### El flujo completo, petición por petición

```
Cliente (Thunder Client / curl)
        │
        ▼
   server.ts        arranca el servidor y escucha en el puerto
        │
        ▼
    app.ts           configura Express: middlewares + rutas, en orden
        │
        ▼
courses.routes.ts     recibe la petición según el método (GET/POST/PUT/DELETE)
        │
        ▼
    store.ts          hace la operación real sobre el array en memoria
        │
        ▼
courses.routes.ts     arma la respuesta con el status code correcto
        │
        ▼
Cliente recibe la respuesta (JSON + status)
```

### Archivo por archivo

**`types.ts` — la ficha técnica de un curso**
Define cómo debe verse un `Course` (con `id`) y dos variantes:
`CreateCourseDto` (sin `id`, porque el servidor lo asigna) y `UpdateCourseDto`
(todos los campos opcionales, porque al actualizar no siempre mandas todo).

**`store.ts` — el archivador**
Aquí vive el "catálogo" real: un array en memoria (`const courses: Course[] = []`).
Como no hay base de datos todavía, **cada vez que reinicias el servidor, se borra
todo** — es normal, se agregará persistencia en semanas futuras.
- `getAll()`: devuelve el array completo.
- `getById(id)`: usa `.find()` para buscar uno.
- `create(data)`: arma un objeto nuevo con `id: nextId++` y lo agrega con `.push()`.
- `update(id, data)`: busca el curso, y si existe, usa `Object.assign()` para
  sobrescribir solo los campos que llegaron.
- `remove(id)`: busca la posición con `.findIndex()` y lo saca con `.splice()`.

**`courses.routes.ts` — el mostrador de atención**
Aquí se decide **qué responder** según lo que pida el cliente. Patrón repetido en
casi todas las rutas: *buscar → si no existe, responder 404 y cortar → si existe,
responder con éxito*. Cada ruta llama a una función de `store.ts`, nunca manipula
el array directamente — así la lógica de datos queda separada de la lógica HTTP.

**`app.ts` — el organizador de la recepción**
Registra los middlewares **en un orden específico**, porque cada petición pasa por
ellos como una fila:
1. `express.json()` — traduce el body de la petición (texto) a un objeto JS usable.
2. Logger — anota cada petición que entra (método, ruta, status, duración).
3. `/health` — una ruta simple para "¿sigues vivo?".
4. `coursesRouter` en `/api/v1/courses` — aquí se conecta todo el CRUD.
5. Handler 404 — si nada de lo anterior respondió, "esa ruta no existe".
6. Error handler global — si algo lanzó una excepción, cae aquí (siempre al final,
   y siempre con 4 parámetros: `err, req, res, next` — así Express sabe que es
   un manejador de errores).

**`server.ts` — el que enciende y apaga las luces**
Arranca el servidor con `app.listen(...)`, y define qué pasa cuando alguien pide
apagarlo (`Ctrl+C` = `SIGINT`, o una señal del sistema = `SIGTERM`): en vez de
cortar de golpe, `server.close()` termina las peticiones en curso primero
("graceful shutdown", cierre ordenado).

### Conceptos clave para recordar

| Concepto | Qué significa |
|---|---|
| **Middleware** | Una función que se ejecuta *antes* de llegar a la ruta final, puede modificar la petición, responder directamente, o dejarla pasar con `next()` |
| **`req` / `res` / `next`** | `req` = lo que llega (params, body); `res` = lo que respondes; `next()` = "pásalo al siguiente middleware" |
| **DTO (Data Transfer Object)** | La "forma" de los datos que se envían/reciben, no siempre igual al modelo completo (ej. sin `id` al crear) |
| **Status codes usados** | `200` OK · `201` Creado · `204` Sin contenido (éxito, pero nada que devolver) · `404` No encontrado · `500` Error del servidor |
| **`req.params` vs `req.body`** | `params` viene de la URL (`/courses/5` → `id: "5"`); `body` viene del JSON que manda el cliente en POST/PUT |
| **Graceful shutdown** | Cerrar un servidor sin cortar peticiones a medias — importante en producción |

### Errores que tuve al montar el entorno (para no repetirlos)

- `package.json`/`tsconfig.json` vacíos → siempre pegar el contenido apenas se crea el archivo.
- Escribir `bash` sin querer en PowerShell te mete a WSL (Linux dentro de Windows), donde Node no estaba instalado → si el prompt cambia a `root@...#`, escribir `exit` para volver a PowerShell.
- El navegador solo sirve para probar `GET` — para `POST`/`PUT`/`DELETE` se necesita Thunder Client o Postman.

### Si lo retomo, lo primero que debo recordar

1. Todo arranca en `server.ts`, que llama a `createApp()` de `app.ts`.
2. El orden de los middlewares en `app.ts` importa — si algo no funciona, revisar que estén en la secuencia correcta.
3. `store.ts` es solo un array en memoria — los datos no sobreviven a un reinicio del servidor (`pnpm dev` los borra todos).
4. Cada ruta sigue el mismo patrón: buscar → 404 si no existe → responder si existe.
