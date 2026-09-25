# Testing con Jest + Supertest — Cursos Online

Entrega semanal para `bc-expressjs`, semana 09
(ver especificación: [bootcamp/week-09-testing/3-proyecto](../README.md)).

## Dominio asignado

**Plataforma de cursos online** — la API de la semana 08 (`Course` + `User`, roles `user`/`admin`,
Helmet, CORS, rate limiting) **sin cambios de comportamiento**, ahora con una **suite de tests
automáticos** que comprueba que todo funciona y que seguirá funcionando cuando se cambie algo.

Esta semana no se agregan funciones a la API: se agrega **confianza** en la API.

## Cómo correr los tests

```bash
pnpm install
pnpm test              # corre todos los tests
pnpm test:watch        # se queda escuchando y repite los tests al guardar un archivo
pnpm test:coverage     # corre los tests y mide qué porcentaje del código se ejecutó
```

**No necesitas Docker ni tener MongoDB instalado ni un `.env`**: los tests usan una base de datos
MongoDB *en memoria* (`mongodb-memory-server`) y ponen sus propias variables de entorno.

> La **primera** vez que corres los tests, `mongodb-memory-server` descarga un binario de MongoDB
> (**~780 MB en Windows**) y lo guarda en `~/.cache/mongodb-binaries`; las siguientes veces ya no
> descarga nada. Con una conexión lenta esa primera ejecución tarda bastante y es normal (el límite
> de tiempo de los tests está en 10 minutos por eso).
>
> **Atajo si ya tienes MongoDB instalado en tu máquina**: apunta `MONGOMS_SYSTEM_BINARY` a tu `mongod`
> y no se descarga nada. En Windows (PowerShell, una sola vez; aplica a las terminales nuevas):
> ```powershell
> setx MONGOMS_SYSTEM_BINARY "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe"
> ```
> Ajusta la ruta a tu versión instalada. Es solo una comodidad local: no está en el código, así que
> en cualquier otra máquina los tests siguen funcionando descargando el binario.

Para levantar la API "de verdad" (no es necesario para los tests): `docker compose up -d`,
copiar `.env.example` a `.env` (con secretos reales), `pnpm seed:admin` y `pnpm dev` — igual que en la
semana 08.

## Qué se prueba

| Archivo | Tipo | Qué comprueba |
|---|---|---|
| `auth.service.test.ts` | Unitario | registro, login, refresh (rotación y reutilización), logout, perfil, listado de usuarios |
| `course.service.test.ts` | Unitario | paginación, 404, 409, y la regla "solo el creador o un admin modifica" |
| `token.service.test.ts` | Unitario | firmar/verificar JWT, tokens vencidos, falsificados o sin rol, hash del refresh token |
| `requireRole.test.ts` | Unitario | 401 sin sesión, 403 con rol insuficiente, varios roles |
| `errorHandler.test.ts` | Unitario | cada tipo de error, y que en producción no se exponga el stack |
| `env.test.ts` | Unitario | la app se niega a arrancar con secretos cortos, iguales, de ejemplo o con CORS `*` |
| `auth.routes.test.ts` | Integración | `/auth`: register (201/409/400), login, me, refresh con rotación, logout |
| `courses.routes.test.ts` | Integración | CRUD completo de cursos y permisos (401/403/404/409/400) |
| `security.routes.test.ts` | Integración | Helmet, CORS con lista blanca, `/users` solo admin, inyección NoSQL y **429** |

### Unitario vs. integración

| | Unitario | Integración |
|---|---|---|
| Qué prueba | **Una** pieza aislada (un service) | El **camino completo** de una petición |
| Dependencias | **Simuladas** con `jest.mock` (sin base de datos) | **Reales** (base de datos en memoria) |
| Velocidad | Muy rápido | Más lento |
| Ejemplo | "si el password es incorrecto, `login` lanza 401" | "`POST /auth/login` con password incorrecto responde 401" |

## Cobertura

`pnpm test:coverage` falla si la cobertura baja de estos umbrales (configurados en `jest.config.ts`):

| Métrica | Mínimo |
|---|---|
| Statements | 80 % |
| Branches | 70 % |
| Functions | 80 % |
| Lines | 80 % |

Se mide todo `src/` salvo `server.ts` y `seedAdmin.ts` (levantan el servidor o se corren a mano; no
tienen lógica que probar). Resultado de la última ejecución: ver la sección *Resultados* al final.

## Decisiones de diseño

- **Los tests se adaptan a la API, no al revés**: la API responde `400` (no `422`) a datos inválidos, y guarda los tokens **solo en cookies HttpOnly** (no hay `accessToken` en el body ni se usa el header `Authorization`). Los tests de integración verifican ese comportamiento: envían las cookies con `.set('Cookie', ...)`.
- **Las sesiones de los tests se fabrican, no se piden por HTTP**: `/register` y `/login` tienen un límite de 5 peticiones por 15 minutos. Si cada test hiciera login real, se toparía con el `429`. Los ayudantes de `helpers/factories.ts` insertan el usuario directo en la base y arman las cookies con los mismos servicios de tokens de la app. Los tests de `/auth` sí llaman a las rutas reales, pero pocas veces.
- **Cada archivo de test tiene su propio contador de rate limit**: Jest carga la app de cero para cada archivo. Por eso la prueba del `429` vive sola en `security.routes.test.ts` y va al final: gasta los 5 intentos de login sin afectar a los otros archivos.
- **Base en memoria: se crea en `beforeAll`, se vacía en `afterEach`, se destruye en `afterAll`**: cada test empieza con la base vacía y no depende de otro. En `courses.routes.test.ts`, además, `beforeEach` crea tres personas nuevas (creador, otro usuario, admin).
- **`clearMocks: true` en `jest.config.ts`**: borra el historial de llamadas de cada mock entre tests, para que un test no "vea" las llamadas del anterior. Las variables de entorno que un test modifica se restauran en `afterEach`.
- **Secretos aleatorios en cada ejecución**: `setup/env.ts` genera los `JWT_*_SECRET` con `crypto.randomBytes`. Ningún secreto queda escrito en el código de los tests.
- **`Model.init()` antes del primer test**: espera a que MongoDB termine de crear los índices `unique` (email, título). Sin eso, el primer test de "409 duplicado" podría correr antes de que el índice exista.
- **Los tests prueban NUESTRO código, no las librerías**: se simulan `bcrypt`, el repository y el servicio de tokens en los tests del service; los tests de tokens verifican qué aceptamos y qué rechazamos, no cómo funciona `jsonwebtoken`.
- **`tsconfig.build.json` excluye `src/__tests__`**: `pnpm build` compila solo el código de la app; los tests los compila `ts-jest` al vuelo.
- **Un test de regresión para `PATCH`**: comprueba que actualizar un curso sin enviar `active` no reactiva un curso desactivado (un error real que tuvieron las semanas 4 a 6 por cómo Zod 4 trata `.partial()`).

---

## 📖 Guía de estudio — cómo funciona por dentro

> Esta sección no es parte del entregable formal, es mi propia referencia para
> repasar el proyecto más adelante.

### La idea del proyecto, en una frase

Hasta ahora, cada vez que cambiaba algo en la API, la única forma de saber si seguía funcionando era
abrir Thunder Client y probar a mano las 20 peticiones de la tabla. Esta semana esa tabla la ejecuta
**un programa**, en segundos, cada vez que quiero: si algo se rompe, los tests me lo dicen antes que el profe.

### La estructura de un test: `describe` / `it` / `expect`

```ts
describe('login', () => {                                   // agrupa tests de una misma cosa
  it('con contraseña incorrecta lanza AppError(401)', async () => {   // un caso, descrito con palabras
    // Arrange (preparar)   mockedRepo.findByEmailWithPassword.mockResolvedValue(usuario)
    // Act (actuar)         const promesa = service.login({ ... })
    // Assert (comprobar)   await expect(promesa).rejects.toMatchObject({ statusCode: 401 })
  });
});
```

El patrón **AAA** (*Arrange, Act, Assert*) ordena cada test: preparo los datos, ejecuto lo que quiero
probar, y compruebo el resultado. Si el `expect` no se cumple, el test falla.

### ¿Qué es un mock?

Un mock es un **doble de prueba**: un objeto falso que reemplaza a una dependencia real para que el test
controle lo que "responde" y pueda ver cómo se usó.

| Herramienta | Para qué sirve |
|---|---|
| `jest.fn()` | Crea una función falsa que **registra** cómo se la llamó (`toHaveBeenCalledWith`) |
| `jest.mock('ruta')` | Reemplaza **todo un módulo** por versiones falsas de sus funciones |
| `mockResolvedValue(x)` | La función falsa devuelve una **promesa que se resuelve** con `x` (para funciones `async`) |
| `mockReturnValue(x)` | La función falsa devuelve `x` **directamente** (para funciones normales) |
| `mockRejectedValue(e)` | La función falsa devuelve una promesa que **falla** con `e` |

Ejemplo real: `auth.service` usa `bcrypt.compare`, que es lento y aleatorio. En el test se reemplaza
por una función falsa que devuelve `true` o `false` a voluntad — así se prueba la **lógica** del service
(¿qué hace si la contraseña no coincide?) sin depender de bcrypt.

### ¿Qué es Supertest y por qué no necesita un puerto?

`supertest` recibe la `app` de Express y la llama **internamente**, sin abrir un puerto de red:
`request(app).get('/health')`. Por eso los tests no chocan si algo ya usa el puerto 3000, y por eso
`app.ts` (que arma la aplicación) está separado de `server.ts` (que hace `app.listen`).

### ¿Por qué una base de datos en memoria?

Los tests de integración necesitan una base de datos real para comprobar cosas como "el índice `unique`
rechaza un email repetido". Pero no deben tocar tus datos ni depender de que Docker esté prendido.
`mongodb-memory-server` levanta un MongoDB **de verdad, temporal, en la memoria RAM**, y lo destruye al
terminar. Cada test arranca con la base vacía.

### El ciclo de vida de los tests (hooks)

| Hook | Cuándo corre | Para qué se usa aquí |
|---|---|---|
| `beforeAll` | Una vez, antes de todos los tests del archivo | Levantar la base en memoria |
| `beforeEach` | Antes de **cada** test | Crear los usuarios de prueba |
| `afterEach` | Después de **cada** test | Vaciar la base (ningún test hereda datos del anterior) |
| `afterAll` | Una vez, al final | Apagar la base en memoria |

`beforeAll` vs. `beforeEach`: el primero es para cosas caras que se comparten (levantar la base); el
segundo es para dejar cada test en un estado limpio.

### `toBe` vs. `toEqual`

`toBe` compara con `===` (misma referencia, para números y textos). `toEqual` compara **el contenido** de
objetos y arrays. `expect({a: 1}).toBe({a: 1})` falla; `toEqual` pasa.

### ¿Qué es la cobertura?

Un reporte de **qué porcentaje del código se ejecutó** mientras corrían los tests: líneas (*lines*),
sentencias (*statements*), funciones (*functions*) y ramas de `if`/`else` (*branches*). Una cobertura alta
no garantiza que no haya errores, pero una baja garantiza que hay código que **nadie ha probado**.

### Errores que me salieron (para no repetirlos)

- **Los tests de `/auth` se topaban con el `429`**: el límite de 5 logins por 15 minutos también aplica en los tests. Solución: fabricar las sesiones directo en la base y llamar a `/login` solo unas pocas veces por archivo.
- **`config/env.ts` lanzaba un error al importarse** dentro de los tests, porque exige variables de entorno: por eso existe `setup/env.ts`, que las define antes de cargar cualquier archivo.

### Si lo retomo en un mes, lo primero que debo recordar

1. Cada test debe poder correr **solo**: si depende de otro, se rompe cuando cambie el orden.
2. Un test sin `expect` no prueba nada (y el profe lo penaliza): siempre debe haber al menos un `assert`.
3. Al agregar una ruta nueva, agregar su test de integración **y** los casos de error (401, 403, 404, 400).
4. Al usar `jest.mock`, siempre limpiar (`clearMocks: true` ya lo hace) para que las llamadas de un test no contaminen al siguiente.
5. `pnpm test:coverage` debe pasar antes de subir cualquier cambio.

---

## Resultados

Última ejecución de `pnpm test:coverage`:

```
Test Suites: 9 passed, 9 total
Tests:       101 passed, 101 total
```

| Métrica | Obtenido | Mínimo exigido |
|---|---|---|
| Statements | 94.9 % | 80 % |
| Branches | 87.5 % | 70 % |
| Functions | 97.05 % | 80 % |
| Lines | 95.01 % | 80 % |

Cobertura de líneas por carpeta: `services` 100 %, `routes` 100 %, `schemas` 100 %, `models` 100 %,
`middlewares` 98 %, `controllers` 95 %, `repositories` 86 %.

Lo poco que queda sin cubrir son ramas de error de Mongoose que solo ocurren con fallos reales de la
base (por ejemplo, una caída de conexión a mitad de una consulta) y `config/db.ts`, que es la conexión
real a MongoDB (los tests usan la base en memoria).

**Comprobación de que los tests sirven**: se rompió a propósito la regla "solo el creador o un admin
modifica un curso" (`if (!isOwner && ...)` → `if (false)`) y el test correspondiente falló. Después se
restauró el código.
