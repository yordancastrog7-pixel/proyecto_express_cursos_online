# Procesador de Datos con Reporte de Catálogo — Cursos Online

Entrega semanal para `bc-expressjs`, semana 01
(ver especificación: [bootcamp/week-01-nodejs_fundamentals/3-proyecto/starter](../README.md)).

## Dominio asignado

**Plataforma de cursos online** — recurso `Course` (`title`, `category`, `instructor`, `price`, `durationHours`, `active`).

## Cómo correr

```bash
pnpm install
pnpm dev                              # resumen del catálogo, sin filtro
pnpm dev -- --category backend        # con filtro por categoría
pnpm build                            # verifica TypeScript estricto
```

Genera `output/report.json` con el resumen del catálogo y los cursos filtrados.

---

## Guía de estudio — cómo funciona por dentro

> Esta sección no es parte del entregable formal, es mi propia referencia para
> repasar el proyecto más adelante.

### La idea del proyecto, en una frase

Imagina que esta herramienta es el **encargado de inventario de una academia online**:
todas las mañanas revisa el catálogo de cursos (`items.json`), separa los que están
activos de los archivados, calcula cuánto vale el catálogo en promedio, identifica el
curso más caro y el más económico, y — si se lo pides — filtra solo los cursos de una
categoría específica (por ejemplo, todos los de `backend`). Al final, deja un reporte
guardado (`report.json`) para quien lo necesite revisar después.

### El flujo completo, paso a paso

```
data/items.json  →  reader.ts  →  processor.ts  →  writer.ts  →  output/report.json
   (entrada)         (lee)         (filtra y         (guarda)         (salida)
                                     calcula)
```

Cada curso pasa por esta línea de ensamblaje. `index.ts` es quien dirige el proceso:
llama a cada función en el orden correcto y captura cualquier error que ocurra en el camino.

### Archivo por archivo

**`types.ts` — el "diccionario" del proyecto**
Aquí no hay lógica, solo se define cómo luce un `Course`: título, categoría, instructor,
precio, duración y si está activo. TypeScript usa esto para avisarte en rojo si en algún
lugar del código intentas usar un curso al que le falta un campo o tiene el tipo equivocado.
Es como la ficha técnica que cualquier curso del catálogo debe cumplir.

**`reader.ts` — quien abre el archivo del catálogo**
Su único trabajo es ir hasta `data/items.json`, abrirlo y devolver la lista de cursos ya
convertida de texto a objetos de JavaScript. Si el archivo no existe o está mal escrito
(JSON inválido), no intenta adivinar — lanza un error claro para que `index.ts` lo atrape.

**`processor.ts` — el que hace las cuentas**
Tiene dos funciones:
- `filterByCategory`: se queda solo con los cursos de la categoría que le pidas
  (`backend`, `frontend`, `data`, `design`, `devops`). Si escribes una categoría que no
  existe, en vez de devolver una lista vacía silenciosamente, te avisa y te dice cuáles
  categorías sí existen — como cuando le preguntas al encargado de la academia "¿tienen
  cursos de cocina?" y te responde "no, pero sí tenemos de backend, frontend...".
- `calculateSummary`: recorre todos los cursos (ya filtrados o no) y saca las estadísticas:
  cuántos hay, cuántos activos, el precio promedio, el más caro, el más barato y qué
  categorías aparecen.

**`writer.ts` — quien archiva el resultado**
Toma todo lo que calculó `processor.ts`, lo convierte a un JSON bien formateado (fácil de
leer para un humano) y lo guarda en `output/report.json`. Si la carpeta `output/` no existe
todavía, la crea sin quejarse.

**`index.ts` — el coordinador**
Lee lo que escribiste en la terminal (`--category backend`), llama a `reader`, luego a
`processor`, luego a `writer`, y muestra un resumen bonito en pantalla. Si algo sale mal en
cualquier paso, lo atrapa con `try/catch`, imprime el error y cierra el programa con
`process.exit(1)` — como una alarma que le avisa a quien esté usando el programa que algo
no salió bien, en vez de fallar en silencio.

### Conceptos de Node.js/TypeScript que aparecen aquí

| Concepto | Dónde se usa | Para qué sirve |
|---|---|---|
| `async/await` | En todas las funciones que leen/escriben archivos | Evita bloquear el programa mientras espera que el disco responda |
| `fs/promises` | `reader.ts`, `writer.ts` | Versión moderna de leer/escribir archivos, basada en promesas |
| `import.meta.dirname` | `reader.ts`, `writer.ts` | Encuentra la ruta de la carpeta actual, sin importar desde dónde se ejecute el comando |
| `process.argv` | `index.ts` | Array con los argumentos que escribiste en la terminal |
| `process.exit(1)` | `index.ts` | Le dice al sistema operativo "esto terminó con un error" |
| TypeScript `strict: true` | Todo el proyecto | Obliga a tipar todo, evita bugs por variables `undefined` sin revisar |
| Módulos ES (`import`/`export`) | Todo el proyecto | Forma moderna de compartir código entre archivos (en vez de `require`) |

### Ejemplos de ejecución

**Catálogo completo:**
```
Resumen del catálogo de cursos
----------------------------------
Filtro aplicado:      (ninguno)
Total de cursos:      12
Activos:              10
Inactivos:            2
Precio promedio:      $54.16
Curso más caro:       Kubernetes Esencial ($89.99)
Curso más barato:     Figma para Principiantes ($19.99)
Categorías:           backend, frontend, data, design, devops
```

**Filtrando por categoría inexistente:**
```
Error: No se encontraron cursos en la categoría "cocina".
Categorías disponibles: backend, frontend, data, design, devops
```

**Archivo de datos faltante:**
```
Error: No se pudo leer el archivo de datos en ".../data/items.json".
Detalle: ENOENT: no such file or directory
```

### lo primero que debo recordar

1. Todo empieza en `index.ts` — ahí está el flujo completo, de arriba hacia abajo.
2. Cada archivo tiene una sola responsabilidad (leer, procesar, o escribir) — si algo
   no funciona, primero identifico en cuál de las tres etapas está el problema.
3. Los errores no se ignoran: se lanzan (`throw`) y se atrapan arriba en `index.ts`
   con `try/catch`, nunca se manejan "in situ" en cada función.