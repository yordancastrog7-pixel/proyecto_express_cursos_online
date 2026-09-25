# API Segura con RBAC — Cursos Online

Entrega semanal para `bc-expressjs`, semana 08
(ver especificación: [bootcamp/week-08-autorizacion_seguridad/3-proyecto](../README.md)).

## Dominio asignado

**Plataforma de cursos online** — recurso `Course` sobre MongoDB + Mongoose. Esta semana la API pasa
de "cualquiera con sesión puede hacer todo" a **"cada persona puede hacer solo lo que su rol permite"**,
y se agregan varias capas de protección: Helmet, CORS con lista blanca, límite de peticiones y
sanitización contra inyección NoSQL.

- **Autenticación** (semana 07) = *¿quién eres?* → login, cookies HttpOnly, JWT.
- **Autorización** (semana 08) = *¿qué puedes hacer?* → roles, propiedad de los cursos.

## Roles y permisos

Hay dos roles: `user` (todo usuario que se registra) y `admin`.

| Acción | Anónimo | `user` | `user` creador del curso | `admin` |
|---|---|---|---|---|
| Ver cursos (`GET`) | Sí | Sí | Sí | Sí |
| Crear curso (`POST`) | 401 | Sí | Sí | Sí |
| Modificar curso (`PATCH`) | 401 | **403** | Sí (el suyo) | Sí (cualquiera) |
| Eliminar curso (`DELETE`) | 401 | **403** | **403** | Sí |
| Listar usuarios (`GET /users`) | 401 | **403** | **403** | Sí |

- **401** = no sé quién eres (sin sesión o token inválido).
- **403** = sé quién eres, pero tu rol no alcanza para esto.

Los roles se escriben en **un solo archivo** (`config/roles.ts`). Ningún controller compara contra
`'admin'` a mano: las rutas usan `requireRole(ROLES.ADMIN)` y el service usa `ROLES.ADMIN`.

## Diagrama de entidades

```
┌─────────────────────────────────┐          ┌─────────────────────────────────┐
│              User                 │          │             Course               │
├─────────────────────────────────┤          ├─────────────────────────────────┤
│ _id            ObjectId        PK │          │ _id            ObjectId        PK │
│ name           String            │          │ title          String @unique    │
│ email          String @unique    │          │ category       String            │
│ password       String (bcrypt)   │   1   N  │ instructor     String            │
│                 select:false     │◀─────────│ price          Number            │
│ role           'user' | 'admin'  │ createdBy│ durationHours  Number            │
│                 (default 'user') │          │ active         Boolean           │
│ refreshToken   String (SHA-256)  │          │ createdBy      ObjectId (ref User)│
│                 select:false     │          │ createdAt / updatedAt            │
│ createdAt / updatedAt            │          └─────────────────────────────────┘
└─────────────────────────────────┘
```

`createdBy` lo pone **el servidor** a partir de la sesión. Si el cliente lo manda en el body, se
ignora (Zod descarta los campos que no conoce).

## Cómo correr

```bash
# 1. Levantar MongoDB
docker compose up -d

# 2. Instalar dependencias
pnpm install

# 3. Variables de entorno
cp .env.example .env
#    Abre el .env y cambia: los dos JWT_*_SECRET (distintos entre sí) y ADMIN_PASSWORD.
#    Generas un secreto con:
#    node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
#    (la app y el seed se niegan a arrancar con los valores de ejemplo)

# 4. Crear el primer administrador (usa ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD del .env)
pnpm seed:admin

# 5. Arrancar el servidor
pnpm dev       # http://localhost:3008
pnpm build     # verifica TypeScript estricto
```

> **Nota sobre puertos**: este proyecto usa `27020` para MongoDB y `3008` para la API porque en esta
> máquina ya están ocupados el `27017` (Mongo nativo), el `27018` y `27019` (semanas 06 y 07) y el `3000`.

## Endpoints

### Auth — `/api/v1/auth`

| Método | Ruta | Descripción | Acceso | Status |
|---|---|---|---|---|
| POST | `/register` | Crear cuenta (siempre con rol `user`) | Público, **5 por 15 min** | 201 / 400 / 409 / 429 |
| POST | `/login` | Iniciar sesión (tokens en cookies) | Público, **5 por 15 min** | 200 / 400 / 401 / 429 |
| GET | `/me` | Mi perfil (incluye mi `role`) | Sesión | 200 / 401 |
| POST | `/refresh` | Renueva la sesión (rotación) | Cookie de refresh | 200 / 401 |
| POST | `/logout` | Cierra la sesión | Público | 204 |

### Users — `/api/v1/users`

| Método | Ruta | Descripción | Acceso | Status |
|---|---|---|---|---|
| GET | `/api/v1/users` | Lista todos los usuarios (sin contraseña) | Solo `admin` | 200 / 401 / 403 |

### Course — `/api/v1/courses`

| Método | Ruta | Descripción | Acceso | Status |
|---|---|---|---|---|
| GET | `/api/v1/courses?page&limit` | Listado paginado | Público | 200 |
| GET | `/api/v1/courses/:id` | Detalle | Público | 200 / 400 / 404 |
| POST | `/api/v1/courses` | Crear (queda como creador quien lo envía) | Sesión | 201 / 400 / 401 / 409 |
| PATCH | `/api/v1/courses/:id` | Actualización parcial | Sesión + creador **o** admin | 200 / 400 / 401 / 403 / 404 |
| DELETE | `/api/v1/courses/:id` | Eliminar | Solo `admin` | 204 / 401 / 403 / 404 |

También disponible (público): `GET /health`. Todo lo que está bajo `/api` cuenta para el límite general
(100 peticiones por 15 minutos por IP).

## Capas de seguridad

| Capa | Dónde | Qué hace | Cómo se comprueba |
|---|---|---|---|
| **Helmet** | `app.ts` | Agrega cabeceras de seguridad a todas las respuestas y quita `X-Powered-By` | `curl -i /health` → `X-Content-Type-Options: nosniff`, `X-Frame-Options`, `Content-Security-Policy`, `Strict-Transport-Security`… |
| **CORS con lista blanca** | `config/security.ts` + `CORS_ORIGINS` | Solo los orígenes listados pueden llamar a la API desde un navegador; nunca `*` | Origen permitido → recibe `Access-Control-Allow-Origin`; origen desconocido → `403` |
| **Rate limit general** | `config/security.ts` | 100 peticiones / 15 min / IP en `/api` | Cabeceras `X-RateLimit-Limit` y `X-RateLimit-Remaining` |
| **Rate limit de auth** | `routes/auth.routes.ts` | 5 peticiones / 15 min / IP en `/register` y `/login` | La 6.ª → `429 Too Many Requests` |
| **RBAC** | `middlewares/requireRole.ts` | `401` sin sesión, `403` con rol insuficiente | Ver tabla de roles |
| **Sanitización NoSQL** | `config/security.ts` | Borra claves que empiezan con `$` o contienen `.` del body | Login con `{"email":{"$gt":""}}` → `400`, no entra |
| **Errores sin stack en producción** | `middlewares/errorHandler.ts` | Con `NODE_ENV=production` el `500` no incluye el stack | Respuesta solo con `error` y `message` |
| **Sin secretos en el código** | `config/env.ts` | Todo sale de `.env`; la app valida largo, valores de ejemplo y que los secretos sean distintos | Arrancar con `CORS_ORIGINS=*` falla con un mensaje claro |

## Ejemplos

```bash
# Cabeceras de seguridad (busca X-Content-Type-Options: nosniff)
curl -i http://localhost:3008/health

# CORS: origen permitido vs. no permitido
curl -i -H "Origin: http://localhost:5173" http://localhost:3008/health   # → Access-Control-Allow-Origin
curl -i -H "Origin: http://evil.com"       http://localhost:3008/health   # → 403 Origen no permitido por CORS

# Registro: aunque se envíe role, queda como "user"
curl -X POST http://localhost:3008/api/v1/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Ana","email":"ana@correo.com","password":"Secreta123","role":"admin"}'
# → 201 { "data": { ..., "role": "user" } }

# Login como usuario y crear un curso
curl -c ana.txt -X POST http://localhost:3008/api/v1/auth/login -H "Content-Type: application/json" \
  -d '{"email":"ana@correo.com","password":"Secreta123"}'
curl -b ana.txt -X POST http://localhost:3008/api/v1/courses -H "Content-Type: application/json" \
  -d '{"title":"Node.js desde Cero","category":"backend","instructor":"Ana","price":49.99,"durationHours":12}'

# Un usuario común no puede borrar → 403
curl -b ana.txt -X DELETE http://localhost:3008/api/v1/courses/<id>

# Sexta petición de login en 15 minutos → 429
# { "error": "Too Many Requests", "message": "Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos." }
```

## Decisiones de diseño

- **El rol viaja dentro del JWT** (claim `role`): el middleware sabe quién eres y qué rol tienes sin consultar la base en cada petición. El costo: si un admin le cambia el rol a alguien, el cambio se ve cuando se emite un token nuevo (el access token dura 15 minutos, y el `/refresh` lee el rol actual de la base).
- **El registro público jamás acepta un rol**: `role` no existe en el esquema de registro, así que Zod lo descarta, y el modelo pone `user` por defecto. Si no, cualquiera podría registrarse como admin (*mass assignment*).
- **El primer admin se crea con `pnpm seed:admin`**, con datos del `.env` (nada en el código). Es la única puerta para crear administradores.
- **`createdBy` lo decide el servidor**: sale de la sesión, nunca del body. Así nadie puede "crear un curso a nombre de otro".
- **La regla "solo el creador o un admin puede modificar" vive en el service**, no en el controller ni en la ruta: es una regla de negocio que depende de datos (quién creó el curso), y no basta con mirar el rol.
- **`DELETE` es solo admin, incluso para el creador**: es lo que pide el profe. Modificar es más común y menos destructivo, así que se permite al creador.
- **Límite estricto solo en `/register` y `/login`**: son los blancos de la fuerza bruta y del spam de cuentas. Si el límite de 5 cubriera también `/refresh`, un uso normal (renovar cada 15 minutos) lo gastaría. Cada ruta tiene su propio contador.
- **El límite cuenta *todas* las peticiones a esa ruta**, no solo las fallidas. Es más simple y protege también contra el spam de registros.
- **`express-mongo-sanitize` se usa como función, no como middleware**: el middleware de la librería intenta reasignar `req.query`, que en Express 5 es de solo lectura. Además, con el parser de query por defecto de Express 5 no se pueden armar objetos anidados desde la URL, así que el body es la única vía de entrada de operadores `$`.
- **La sanitización es una segunda línea de defensa**: la primera es Zod, que exige que `email` sea un texto (un objeto `{"$gt":""}` ya no pasa). Con la sanitización, además, el operador se borra antes de llegar a cualquier consulta.
- **CORS acepta peticiones sin cabecera `Origin`** (curl, Thunder Client, otros servidores): CORS es una protección *del navegador*; esas peticiones se protegen con la autenticación.
- **Helmet con valores por defecto**: ya trae `nosniff`, `X-Frame-Options`, CSP y HSTS. `Strict-Transport-Security` solo tiene efecto sobre HTTPS; en `http://localhost` el navegador lo ignora.

---

## 📖 Guía de estudio — cómo funciona por dentro

> Esta sección no es parte del entregable formal, es mi propia referencia para
> repasar el proyecto más adelante.

### La idea del proyecto, en una frase

En la semana 07 el edificio tenía **recepción** (quién eres). Ahora además tiene **credenciales de
colores y puertas con cerradura**: todos entran, pero el visitante común solo abre algunas puertas, el
dueño de una oficina abre la suya, y solo el administrador abre todas. Además hay **cámaras y
vigilantes** (Helmet, CORS, límites) que actúan antes de que alguien llegue a una puerta.

### El camino de una petición, capa por capa

```
Petición
  │
  ▼
1. helmet()          pone cabeceras de seguridad en la respuesta
  │
  ▼
2. morgan            registra la petición en el log
  │
  ▼
3. CORS              ¿el origen está en la lista blanca?   no → 403
  │
  ▼
4. globalLimiter     ¿más de 100 peticiones en 15 min?     sí → 429
  │
  ▼
5. express.json()    lee el body
  │
  ▼
6. sanitizeInput     borra operadores $ del body
  │
  ▼
7. cookieParser      lee las cookies
  │
  ▼
8. Router
     ├─ (auth) authLimiter  ¿más de 5 en 15 min?          sí → 429
     ├─ authMiddleware      ¿token válido?                no → 401   (llena req.user con id y rol)
     ├─ requireRole(...)    ¿el rol alcanza?              no → 403
     └─ controller → service (¿eres el creador o admin?  no → 403) → repository → Mongo
```

El orden importa: lo más barato y general va primero (cabeceras, CORS, límite) para rechazar rápido
sin gastar recursos, y lo específico de cada ruta (auth, rol, propiedad) va al final.

### Autenticación vs. autorización

| | Autenticación | Autorización |
|---|---|---|
| Pregunta | ¿Quién eres? | ¿Qué puedes hacer? |
| Falla con | `401` | `403` |
| Dónde | `authMiddleware` | `requireRole` y reglas del service |
| Ejemplo | Cookie con un token inválido | Un `user` intentando `DELETE` |

### ¿Qué es RBAC?

*Role-Based Access Control*: los permisos no se dan persona por persona, sino por **rol**. Cada usuario
tiene un rol, y cada ruta dice qué roles pueden usarla. Si mañana hay un rol `moderator`, se agrega en
`config/roles.ts` y se usa en las rutas que corresponda — sin tocar controllers.

### Archivo por archivo (lo nuevo de esta semana)

**`config/roles.ts` — los roles en un solo lugar**
`ROLES`, el tipo `Role` y `isRole()`, que confirma que un valor que viene "de afuera" (por ejemplo, el
payload de un JWT) es un rol real.

**`middlewares/requireRole.ts` — la cerradura**
Recibe los roles permitidos y devuelve un middleware. Sin `req.user` → `401`; con un rol que no está en
la lista → `403`. Va siempre *después* de `authMiddleware`.

**`middlewares/auth.middleware.ts`**
Ahora también lee el `role` del token y lo deja en `req.user`. Un token con firma válida pero sin un rol
reconocido se rechaza. Incluye `getUser(req)`, que devuelve `req.user` sin el "quizá `undefined`" de
TypeScript.

**`config/security.ts` — CORS, límites y sanitización**
Agrupa las capas que no son Helmet. `createAuthLimiter()` es una función (no una constante) para que
`/register` y `/login` no compartan contador.

**`services/course.service.ts` — la regla de propiedad**
`update` primero busca el curso (404 si no existe), compara `createdBy` con quien lo pide, y solo deja
pasar al creador o a un admin.

**`seedAdmin.ts` — el primer administrador**
Lee `ADMIN_NAME`, `ADMIN_EMAIL` y `ADMIN_PASSWORD` del `.env`, valida con las mismas reglas del registro
(`registerSchema`), y crea el usuario con rol admin — o, si el email ya existe, solo le asigna el rol.

### Conceptos clave para recordar

| Concepto | Qué significa |
|---|---|
| **RBAC** | Permisos por rol, no por persona |
| **401 vs. 403** | 401 = no estás identificado; 403 = estás identificado pero no tienes permiso |
| **Mass assignment** | Que el cliente logre asignarse campos que no debería (ej. `role: "admin"`) porque el servidor copia el body sin filtrar |
| **Helmet** | Librería que agrega cabeceras HTTP de seguridad de un solo golpe |
| **`X-Content-Type-Options: nosniff`** | Evita que el navegador "adivine" el tipo de un archivo y ejecute como script algo que no lo es |
| **CSP** | Le dice al navegador de dónde puede cargar scripts, estilos e imágenes |
| **HSTS** | Le dice al navegador "a este sitio entra siempre por HTTPS"; por eso no aplica en HTTP |
| **CORS** | Regla *del navegador* que decide qué otros sitios web pueden llamar a tu API |
| **`Access-Control-Allow-Origin: *`** | Permite que cualquier sitio llame a la API; peligroso combinado con sesiones |
| **Rate limiting** | Frena a quien hace demasiadas peticiones (fuerza bruta, abuso) con un `429` |
| **NoSQL injection** | Mandar operadores de Mongo (`{"$gt": ""}`) donde se esperaba un texto, para que la consulta coincida con todo |
| **XSS** | Inyectar JavaScript que corre en el navegador de otra persona; en una API JSON el riesgo real está en el sitio que muestre esos datos |

### Si lo retomo en un mes, lo primero que debo recordar

1. Una ruta nueva es **pública por defecto**: si debe ser privada, hay que ponerle `authMiddleware`, y si además depende del rol, `requireRole(...)`.
2. Nunca escribir `'admin'` a mano fuera de `config/roles.ts`.
3. Nunca copiar el body de un registro o de un update directo a la base sin pasar por un esquema de Zod: es la puerta del *mass assignment*.
4. `requireRole` responde 403 y `authMiddleware` responde 401: no mezclarlos.
5. Si el límite de `/login` estorba probando, se resetea reiniciando el servidor (el contador vive en memoria).
