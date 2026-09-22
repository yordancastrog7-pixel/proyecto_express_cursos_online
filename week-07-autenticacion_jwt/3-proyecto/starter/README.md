# Autenticación JWT — Cursos Online

Entrega semanal para `bc-expressjs`, semana 07
(ver especificación: [bootcamp/week-07-autenticacion_jwt/3-proyecto](../README.md)).

## Dominio asignado

**Plataforma de cursos online** — recurso protegido `Course` (`title`, `category`, `instructor`,
`price`, `durationHours`, `active`) sobre MongoDB + Mongoose, y un nuevo recurso `User` que
permite registrarse, iniciar sesión y consultar los cursos **solo estando autenticado**.

Esta semana no se agregan entidades del dominio: se agrega **quién puede usar la API**.

## Diagrama de entidades

```
┌───────────────────────────────┐            ┌───────────────────────────────┐
│             User                │            │            Course              │
├───────────────────────────────┤            ├───────────────────────────────┤
│ _id            ObjectId    PK │            │ _id            ObjectId    PK │
│ name           String         │            │ title          String @unique │
│ email          String @unique │            │ category       String         │
│ password       String (bcrypt)│  (sin      │ instructor     String         │
│                 select:false  │  relación  │ price          Number         │
│ refreshToken   String (SHA256)│  directa)  │ durationHours  Number         │
│                 select:false  │            │ active         Boolean        │
│ createdAt / updatedAt  Date   │            │ createdAt / updatedAt  Date   │
└───────────────────────────────┘            └───────────────────────────────┘
```

`User` y `Course` no se relacionan entre sí: el usuario no es "dueño" de los cursos, solo
necesita una sesión válida para usarlos (quién puede hacer *qué* es tema de la semana 08).

## Cómo correr

```bash
# 1. Levantar MongoDB
docker compose up -d

# 2. Instalar dependencias
pnpm install

# 3. Variables de entorno
cp .env.example .env
#    ¡IMPORTANTE! Abre el .env y reemplaza los dos JWT_*_SECRET por secretos reales y
#    DISTINTOS entre sí. Generas cada uno con:
#    node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
#    (la app se niega a arrancar con los valores de ejemplo)

# 4. Arrancar el servidor
pnpm dev       # http://localhost:3007
pnpm build     # verifica TypeScript estricto
```

> **Nota sobre puertos**: este proyecto usa `27019` para MongoDB y `3007` para la API porque
> en esta máquina el `27017` (Mongo nativo), el `27018` (semana 06) y el `3000` (otro
> proyecto) ya están ocupados.

## Endpoints

### Auth — `/api/v1/auth`

| Método | Ruta | Descripción | Requiere sesión | Status |
|---|---|---|---|---|
| POST | `/register` | Crear cuenta (la contraseña se guarda hasheada) | No | 201 / 400 / 409 |
| POST | `/login` | Iniciar sesión — entrega los tokens **en cookies** | No | 200 / 400 / 401 |
| GET | `/me` | Perfil del usuario logueado (sin contraseña) | **Sí** | 200 / 401 |
| POST | `/refresh` | Renueva la sesión y **rota** el refresh token | Cookie de refresh | 200 / 401 |
| POST | `/logout` | Cierra la sesión e invalida el refresh token | No | 204 |

### Course — `/api/v1/courses` (todas requieren sesión)

| Método | Ruta | Descripción | Status |
|---|---|---|---|
| GET | `/api/v1/courses?page&limit` | Listado paginado | 200 / 401 |
| GET | `/api/v1/courses/:id` | Detalle | 200 / 400 / 401 / 404 |
| POST | `/api/v1/courses` | Crear (valida con Zod) | 201 / 400 / 401 / 409 |
| PATCH | `/api/v1/courses/:id` | Actualización **parcial** | 200 / 400 / 401 / 404 |
| DELETE | `/api/v1/courses/:id` | Eliminar | 204 / 400 / 401 / 404 |

También disponible (público): `GET /health`.

## Ejemplos de request/response

```bash
# Registro
curl -X POST http://localhost:3007/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana Torres","email":"ana@correo.com","password":"Secreta123"}'
# → 201 { "data": { "id": "...", "name": "Ana Torres", "email": "ana@correo.com", "createdAt": "..." } }
#   (nunca aparece la contraseña)

# Login: -c guarda las cookies que manda el servidor en un archivo
curl -i -c cookies.txt -X POST http://localhost:3007/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@correo.com","password":"Secreta123"}'
# → 200, y en las cabeceras:
#   Set-Cookie: accessToken=...;  Max-Age=900;    Path=/;            HttpOnly; SameSite=Strict
#   Set-Cookie: refreshToken=...; Max-Age=604800; Path=/api/v1/auth; HttpOnly; SameSite=Strict
#   (el cuerpo trae solo los datos del usuario, ningún token)

# Usar la sesión: -b envía las cookies guardadas
curl -b cookies.txt http://localhost:3007/api/v1/auth/me
curl -b cookies.txt http://localhost:3007/api/v1/courses

# Sin sesión → 401
curl http://localhost:3007/api/v1/courses
# → 401 { "error": "Unauthorized", "message": "No autenticado" }

# Renovar la sesión (rotación): -b lee las cookies y -c guarda las nuevas
curl -b cookies.txt -c cookies.txt -X POST http://localhost:3007/api/v1/auth/refresh

# Cerrar sesión
curl -b cookies.txt -X POST http://localhost:3007/api/v1/auth/logout   # → 204
```

## Seguridad: qué se hizo y por qué

| Medida | Cómo quedó | Por qué |
|---|---|---|
| **Contraseñas con bcrypt** | `bcrypt.hash(password, 10)` (asíncrono) y `bcrypt.compare()` para verificar | Nunca se guarda ni se compara texto plano; 10 rondas hacen lento el ataque por fuerza bruta |
| **Contraseña oculta** | `password: { select: false }` en el modelo | Ninguna consulta la trae por accidente; solo el login la pide con `.select('+password')` |
| **Access token corto** | JWT de **15 minutos** | Si lo roban, sirve poco tiempo |
| **Refresh token largo** | JWT de **7 días**, en cookie aparte que solo viaja a `/api/v1/auth` | Permite renovar sin pedir la contraseña otra vez, pero casi nunca se envía |
| **Secretos distintos** | `JWT_ACCESS_SECRET` ≠ `JWT_REFRESH_SECRET` (la app lo exige al arrancar) | Un refresh token no puede hacerse pasar por access token, ni al revés |
| **Cookies HttpOnly** | `httpOnly: true`, `sameSite: 'strict'`, `secure` en producción | JavaScript del navegador no puede leer los tokens (un XSS no los roba); `strict` frena CSRF |
| **Sin tokens en el body ni en localStorage** | Los tokens solo viajan en cookies | Es donde son más difíciles de robar |
| **Refresh token hasheado en la BD** | Se guarda `SHA-256(refreshToken)`, no el token | Si alguien lee la base, no puede usar lo que ve |
| **Rotación** | Cada `/refresh` emite un refresh token nuevo y el anterior deja de servir | Un token robado tiene ventana de uso limitada |
| **Detección de reutilización** | Si llega un refresh token auténtico pero ya rotado, se cierra la sesión entera | Señal de que alguien más lo tiene: se invalida todo |
| **Sin enumeración de usuarios** | Email inexistente y contraseña incorrecta → mismo `401 Credenciales inválidas`, y el mismo tiempo de respuesta | Nadie puede averiguar qué emails están registrados |
| **Sin secretos en el código** | Todo sale del `.env` (que no se sube a git) | Si el repo se filtra, los secretos no |

## Decisiones de diseño

- **Refresh token hasheado con SHA-256, no con bcrypt**: bcrypt solo lee los primeros 72 bytes, y los JWT de un mismo usuario empiezan casi idénticos — dos tokens distintos podrían dar el mismo hash. Además, un refresh token ya es largo y aleatorio: no hay una "contraseña débil" que proteger con un hash lento. SHA-256 es la práctica estándar para esto.
- **`jwtid` (UUID) en el refresh token**: garantiza que dos refresh tokens emitidos en el mismo segundo sean distintos; sin eso, la rotación podría entregar un token idéntico al anterior.
- **`bcrypt.compare` siempre se ejecuta en el login**, incluso si el email no existe (contra un hash de relleno): si no, un email inexistente respondería más rápido y delataría que no está registrado.
- **El registro sí responde `409` si el email ya existe**: es el compromiso habitual — el usuario necesita saber que su email ya tiene cuenta. La enumeración se evita en el *login*, que es donde importa.
- **El logout usa el refresh token, no el access token**: así funciona aunque el access token ya haya vencido (15 minutos pasan rápido).
- **Un solo refresh token por usuario** (campo `refreshToken` en el modelo): iniciar sesión en otro dispositivo cierra la sesión del anterior. Simple y suficiente para esta semana.
- **`PATCH`, no `PUT`, para actualizar**: el profe lo pide así — se envía solo lo que cambia.
- **El esquema de actualización no parte de `create.partial()`**: en Zod 4, `.partial()` vuelve a aplicar los valores por defecto. `active` tiene `default(true)` al crear, así que un PATCH sin ese campo habría **reactivado** un curso desactivado. Por eso el update se arma desde los campos base, sin defaults.
- **La cookie y el JWT comparten una misma constante de duración** (`auth.config.ts`): así la cookie nunca queda viva con un token ya vencido, ni al revés.
- **`env.ts` valida los secretos al arrancar**: mínimo 32 caracteres, distintos entre sí, y no acepta los valores de ejemplo de `.env.example`.

---

## 📖 Guía de estudio — cómo funciona por dentro

> Esta sección no es parte del entregable formal, es mi propia referencia para
> repasar el proyecto más adelante.

### La idea del proyecto, en una frase

Hasta la semana 06, cualquiera que conociera la URL podía leer, crear y borrar cursos. Esta
semana la API se convierte en un **edificio con recepción**: primero te registras (te dan
tu ficha, con la contraseña guardada en clave), luego te identificas (`login`) y te dan **dos
credenciales** — una de corta duración (access token, para pasar por las puertas) y otra de
larga duración (refresh token, guardada en recepción para renovar la primera sin volver a
identificarte).

### ¿Qué es un JWT?

Un texto de tres partes separadas por puntos: `cabecera.payload.firma`.

- **Cabecera**: el algoritmo con que se firmó (`HS256`).
- **Payload**: los datos (en nuestro caso, el id del usuario en `sub` y cuándo vence en `exp`).
- **Firma**: se calcula con el secreto que solo conoce el servidor.

**Importante**: el JWT va *firmado*, **no cifrado**. Cualquiera puede leer el payload (es solo
base64) — por eso nunca se pone ahí nada sensible. Lo que la firma garantiza es que **nadie lo
modificó**: si alguien cambia el `sub` para hacerse pasar por otro usuario, la firma deja de
coincidir y el servidor lo rechaza.

### El flujo completo

```
1. REGISTRO      POST /auth/register {name,email,password}
                   → Zod valida → bcrypt.hash(password) → se guarda el HASH → 201 (sin password)

2. LOGIN         POST /auth/login {email,password}
                   → busca el usuario → bcrypt.compare(password, hash)
                   → si coincide: firma accessToken (15 min) + refreshToken (7 días)
                   → guarda SHA-256(refreshToken) en el usuario
                   → responde con 2 cookies HttpOnly (el body NO trae tokens)

3. USAR LA API   GET /courses   (el navegador/cliente envía la cookie accessToken solo)
                   → authMiddleware: ¿hay cookie? ¿la firma es válida? ¿no venció?
                   → si sí: req.user = { id } y sigue al controller
                   → si no: 401

4. RENOVAR       POST /auth/refresh   (cuando el access token venció)
                   → verifica el refreshToken (secreto distinto) → compara su SHA-256 con el guardado
                   → si coincide: emite AMBOS tokens nuevos y guarda el hash nuevo (ROTACIÓN)
                   → si el token es auténtico pero NO es el vigente: alguien lo reutiliza
                     → se borra el hash guardado (sesión cerrada) y 401

5. LOGOUT        POST /auth/logout
                   → borra el hash guardado + borra ambas cookies
                   → el refresh token que tenía la persona ya no sirve para nada
```

### Por qué dos tokens y no uno solo

Un solo token de larga vida sería cómodo pero peligroso: si lo roban, sirve durante días. Uno
solo de vida corta obligaría a pedir la contraseña cada 15 minutos. Con dos:

- El **access token** (15 min) viaja en *cada* petición → es el más expuesto, pero vale poco tiempo.
- El **refresh token** (7 días) casi nunca viaja (solo a `/auth/refresh`) y **además** está
  guardado hasheado en la base, así que el servidor puede revocarlo cuando quiera. Un JWT solo
  no se puede "cancelar" antes de que venza; este truco sí permite hacerlo.

### Por qué cookies HttpOnly y no localStorage

Si el token está en `localStorage`, cualquier JavaScript que corra en la página (por ejemplo, uno
inyectado por un ataque XSS) puede leerlo y enviarlo a un atacante. Una cookie `HttpOnly` el
navegador la manda solo, pero **el JavaScript no puede leerla**. `SameSite=Strict` además evita que
otro sitio web dispare peticiones a tu API usando tu sesión (CSRF).

### Archivo por archivo

**`config/env.ts` — el guardia de la puerta de entrada**
Lee las variables de entorno y **se niega a arrancar** si falta alguna, si un secreto tiene menos
de 32 caracteres, si conserva el valor de ejemplo, o si los dos secretos son iguales.

**`config/auth.config.ts` — las constantes de seguridad**
`SALT_ROUNDS`, la duración de cada token (que también usan las cookies) y los nombres de las cookies,
todo en un solo lugar.

**`models/user.model.ts`**
`password` y `refreshToken` llevan `select: false`: no salen en ninguna consulta salvo que se pidan
con `.select('+campo')`. Es una red de seguridad contra devolver por error datos sensibles.

**`services/token.service.ts` — firmar y verificar**
Firma con `HS256`, verifica firma **y** expiración (`jwt.verify`), y fija el algoritmo permitido para
rechazar tokens `alg:none`. También tiene `hashToken` (SHA-256) y una comparación en tiempo
constante (`timingSafeEqual`) para que el tiempo de respuesta no revele cuántos caracteres coinciden.

**`services/auth.service.ts` — la lógica de negocio**
Aquí viven las reglas: hashear al registrar, comparar al loguear (con el hash de relleno), emitir y
rotar tokens, y detectar la reutilización de un refresh token viejo.

**`middlewares/auth.middleware.ts` — el portero**
Lee la cookie `accessToken`, la verifica y deja `req.user = { id }` para los siguientes pasos. Se
aplica con una sola línea (`courseRouter.use(authMiddleware)`), que protege todas las rutas de cursos.

**`controllers/auth.cookies.ts`**
Un solo lugar que define las opciones de las cookies (`httpOnly`, `sameSite`, `secure`, duración y
`path`) para enviarlas y para borrarlas (para borrar una cookie hay que usar el mismo `path` con el
que se creó).

### Conceptos clave para recordar

| Concepto | Qué significa |
|---|---|
| **Hash** | Transformación de un solo sentido: de la contraseña sale un texto que no se puede "des-hacer". Para verificar, se hashea lo que escribe la persona y se compara |
| **Salt** | Texto aleatorio que bcrypt mezcla con cada contraseña antes de hashear: dos usuarios con la misma contraseña obtienen hashes distintos |
| **Salt rounds (10)** | Cuánto trabajo hace bcrypt: cada +1 duplica el tiempo. Lo suficiente para frenar ataques, sin volver lento el login |
| **JWT** | Token firmado (no cifrado) con `cabecera.payload.firma` |
| **`sub` / `exp`** | Claims estándar del JWT: a quién pertenece / cuándo vence |
| **Access vs. refresh token** | Corto y muy usado / largo y casi nunca enviado, revocable |
| **Rotación** | Cada renovación entrega un refresh token nuevo e invalida el anterior |
| **HttpOnly** | La cookie no es legible desde JavaScript |
| **401 vs. 403** | 401 = no sé quién eres (sin sesión o token inválido); 403 = sé quién eres pero no tienes permiso (semana 08) |
| **`select: false`** | Campo que Mongoose no devuelve a menos que se pida explícitamente |
| **Enumeración de usuarios** | Poder averiguar qué emails están registrados por diferencias en el mensaje o el tiempo de respuesta |

### Si lo retomo en un mes, lo primero que debo recordar

1. **Nunca** poner un secreto en el código ni subir el `.env` a git — solo `.env.example` con valores falsos.
2. Si cambio la duración de un token, se cambia **solo** en `auth.config.ts`: la cookie la toma de ahí.
3. Todo endpoint nuevo que deba ser privado va detrás de `authMiddleware`; por defecto, una ruta nueva es pública.
4. Al actualizar con `.partial()` de Zod 4, **cuidado con los `default()`**: se vuelven a aplicar. Armar el esquema de update desde los campos base sin defaults.
5. Los errores de login deben decir siempre lo mismo (`Credenciales inválidas`): nunca "el email no existe" ni "contraseña incorrecta" por separado.
