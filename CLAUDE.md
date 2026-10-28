# TURIPAT-BACK — Reglas del proyecto para Claude

Eres un desarrollador backend experto en Node.js, Express 5 y TypeScript. Este archivo se carga en cada sesión: **síguelo siempre y no contradigas su estructura sin avisar**. Detalle ampliado en [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (léelo antes de crear un módulo nuevo o cambiar la arquitectura).

## Contexto del proyecto

Backend REST de **TURIPAT — Ecosistema Inteligente para Turismo Patrimonial**: una PWA (frontend Angular en `../TURIPAT-FRONT`) que actúa como conserje turístico. Genera itinerarios personalizados hacia negocios locales, artesanos, museos y sitios históricos para descentralizar el turismo.

Actores: **Turista** (visitante sin registro u opcionalmente autenticado), **Comerciante/Artesano** (autenticado con JWT) y **Motor inteligente** (rutas, TSP, recomendación equitativa).

### Estado actual

- **MongoDB está integrada** (`config/database.ts`; exige `MONGODB_URI` en `.env`). El esquema se aplica con `npm run db:setup`: 12 colecciones definidas como `$jsonSchema` en `src/database/schema/`, cada una con sus índices. `npm run db:verify` comprueba que la base real coincide con la definición. **Sin datos mock ni seeds.**
- **Acceso a datos con el driver nativo, sin modelos Mongoose.** Los services leen y escriben con `getCollection<T>()` de `src/common/db/collection.ts`; `*.model.ts` solo declara las interfaces del dominio. El esquema ya está validado en Mongo (`$jsonSchema`) y en el borde (Zod), así que un modelo sería una tercera definición del mismo esquema.
- Solo `health` (referencia) y `example` (plantilla didáctica de CRUD con validación, errores y tests; puede borrarse al empezar los módulos reales) tienen código. Las **8 carpetas de dominio ya existen** en `src/modules/` con un `.gitkeep`; cada una se puebla copiando la plantilla `health` cuando arranca su primera historia. **No se crean archivos vacíos** (`*.routes.ts` sin rutas, `*.service.ts` sin lógica): la carpeta espera vacía hasta que haya código real.

### Mapa de módulos → requisitos funcionales

Cada módulo es **dueño único** de sus colecciones (detalle y reglas de frontera en `context/agente/plan-modulos.md` §4).

| Módulo (`src/modules/`) | Responsabilidad                                                             | Colecciones                | RF                 |
| ----------------------- | --------------------------------------------------------------------------- | -------------------------- | ------------------ |
| `auth`                  | Registro/login de turista y comercio, JWT, sesiones, perfil y preferencias   | `accounts`, `sessions`     | 02, 03, 15, 16, RNF-07 |
| `catalog`               | Categorías de lugares y sitios patrimoniales (solo el admin escribe)         | `categories`               | 05, 17, 26         |
| `places`                | Lugares: búsqueda por proximidad, ficha, fotos, QR y estado                  | `places`                   | 11, 17, 18, 22, 26 |
| `itineraries`           | Rutas: generación, edición, reemplazo y sincronización                       | `itineraries`              | 01, 03–07, 09, 10  |
| `itineraries/engine/`   | Motor: proximidad, TSP, equidad y afluencia. **Sin router ni colecciones**   | —                          | 08, 22–25          |
| `checkins`              | Check-in por QR + GPS, afluencia anónima y calificaciones                    | `checkins`, `affluencePings`, `ratings` | 12, 14, 24, 25 |
| `promotions`            | Promociones y cupones: crear, pausar, reclamar y canjear                     | `promotions`, `coupons`, `promotionCounters` | 13, 19, 20 |
| `analytics`             | Métricas diarias y panel del comercio (único escritor de `dailyMetrics`)     | `dailyMetrics`             | 21                 |

### Reglas de negocio que el código debe respetar

- Rango horario máximo **12 h/día** y máximo **10 paradas** por itinerario (RF-05/06). Validar en el schema Zod.
- El turista indica un **rango horario** (ej. 10:00–16:00), no horas sueltas; se cruza con los horarios de apertura de cada comercio.
- Mínimo **2 alternativas** de ruta sugerida. Solo comercios abiertos dentro de la ventana elegida.
- La optimización TSP se ejecuta **solo cuando el usuario la pide** (botón); reordenar a mano nunca re-optimiza (RF-08).
- NIT del comerciante: validar **dígito de verificación (módulo 11)** en el backend (RF-15).
- Check-in válido solo a **≤ 50 m** del local (RF-12). Cupones: estado `redeemed` inmediato y no reutilizable; al llegar al límite diario se ocultan hasta el día siguiente (RF-19/20).
- Analíticas **anónimas y consolidadas**: jamás exponer nombres/correos de turistas (RF-21).
- Consultas de cercanía con **índices geoespaciales de MongoDB** (`2dsphere`) (RF-22, RNF-01). El TSP debe ser **asíncrono**, sin bloquear el event loop (RNF-02).
- Sesiones con JWT y cierre automático por inactividad (RNF-07). Privacidad de geolocalización conforme a Ley 1581.

## Stack y versiones

- **Node.js ≥ 22** (desarrollo en 24, ver `.nvmrc`), **TypeScript 6** en modo `strict`, **CommonJS** (`module: node16`, sin `"type": "module"`).
- **Express 5** (los errores de handlers async llegan solos al `errorHandler`; **no** uses `express-async-errors` ni envoltorios `asyncHandler`).
- **Zod 4** para validar entorno y entrada. **swagger-jsdoc + swagger-ui-express** para OpenAPI. **helmet, cors, morgan**.
- **Vitest + Supertest** para tests. **ESLint (flat config) + Prettier**.
- Imports **relativos sin extensión** (no hay alias de paths ni `.js` en los imports).

## Estructura (por módulos de dominio)

```
src/
├─ server.ts            # arranque, listen y cierre ordenado (único archivo con side effects de red)
├─ app.ts               # createApp(): middlewares globales, swagger, rutas, errores (testeable)
├─ routes.ts            # registra el router de cada módulo
├─ config/              # env.ts (Zod), database.ts (conexión), swagger.ts
├─ common/              # código transversal reutilizable
│  ├─ db/               # getCollection<T>(): acceso tipado a Mongo
│  ├─ errors/           # AppError
│  ├─ middlewares/      # validate, not-found, error-handler, authorize (+ authenticate en H2.6)
│  ├─ utils/            # logger, response
│  └─ types/            # tipos compartidos (auth.ts, express.d.ts)
├─ database/            # esquema: 12 colecciones $jsonSchema + setup.ts / verify.ts
└─ modules/<modulo>/
   ├─ <modulo>.routes.ts      # rutas + anotaciones @openapi + validate()
   ├─ <modulo>.controller.ts  # HTTP: lee req, llama al service, responde con sendSuccess
   ├─ <modulo>.service.ts     # lógica de negocio, sin tocar req/res
   ├─ <modulo>.model.ts       # interfaces del dominio (NO es un modelo Mongoose)
   ├─ <modulo>.schema.ts      # esquemas Zod de entrada (body/params/query) y sus tipos inferidos
   └─ <modulo>.test.ts        # tests del módulo (junto al código)
```

`src/modules/health/` es la **plantilla de referencia**: cópiala al crear un módulo nuevo.

## Convenciones

- Archivos: `kebab-case` con sufijo de rol (`places.service.ts`, `app-error.ts`). Clases/tipos `PascalCase`; variables y funciones `camelCase`; constantes de entorno `UPPER_SNAKE_CASE`.
- Idioma: **carpetas, archivos, identificadores y rutas de la API en inglés** (`src/modules/places/`, `createPlace`). Los **comentarios, documentación, mensajes de error al cliente y textos visuales pueden ir en español**. Campos JSON de la API en `camelCase` y en inglés (`name`, `createdAt`).
- Capas: `routes → controller → service`. El controller **no** contiene lógica de negocio; el service **no** conoce `req`/`res`. El acceso a datos va siempre dentro del service con `getCollection<T>()` (`src/common/db/collection.ts`), nunca en el controller y nunca con `mongoose.connection` suelto.
- TypeScript: prohibido `any` (usa `unknown`), prefiere inferencia cuando el tipo es obvio, `import type` para tipos, `async/await` (sin callbacks). Sin `console.*`: usa `common/utils/logger`.
- Variables de entorno: **solo** se leen desde `config/env.ts` (validadas con Zod). Toda variable nueva se añade ahí **y** en `.env.example`. Nunca `process.env` suelto ni secretos en el código.
- Rutas: prefijo `API_PREFIX` (por defecto `/api/v1`), recursos en plural y minúsculas (`/places/:id/promotions`). Verbos HTTP correctos y códigos de estado precisos (201 al crear, 204 al borrar, 400/401/403/404/409 según el caso).
- Formato de respuesta **siempre** uniforme:
  - Éxito: `{ "success": true, "data": ... }` (usa `sendSuccess`).
  - Error: `{ "success": false, "error": { "code", "message", "details?" } }`. Lanza `AppError` (`AppError.notFound()`, etc.); el `errorHandler` global lo formatea. No respondas errores a mano en los controllers.
- Validación: toda entrada externa pasa por `validate({ body, params, query })` con un schema Zod. Tipos de entrada = `z.infer<typeof schema>`.
- Seguridad: no filtrar stack traces en producción, no loguear datos personales ni coordenadas de turistas, endpoints privados con middleware de auth/roles, `helmet` y CORS restringido a `CORS_ORIGINS`.

## Documentación Swagger (obligatoria)

Cada endpoint nuevo **debe** llevar su bloque `@openapi` en el `*.routes.ts` del módulo (ver `health.routes.ts`): tag, summary, parámetros, `requestBody`, respuestas (incluidas las de error con `$ref: '#/components/schemas/ErrorResponse'`) y `security: [{ bearerAuth: [] }]` si es privado. Esquemas reutilizables van en `components.schemas` de `config/swagger.ts`. Añade el tag del módulo en `tags` de ese mismo archivo. UI en `/api-docs`, JSON en `/api-docs.json`.

## Flujo para añadir un módulo o endpoint

1. Copia la estructura de `src/modules/health/` a `src/modules/<modulo>/` y adapta el contenido.
2. Define `model` y `schema` (Zod) → `service` → `controller` → `routes` (con `@openapi` y `validate`).
3. Registra el router en `src/routes.ts` y el tag en `config/swagger.ts`.
4. Escribe tests en `<modulo>.test.ts` (Supertest sobre `createApp()`; cubre éxito, validación 400 y no encontrado).
5. Ejecuta **antes de dar la tarea por terminada**: `npm run typecheck && npm run lint && npm test`.
6. Si cambiaste la estructura o las convenciones, actualiza este archivo y `docs/ARCHITECTURE.md` en el mismo cambio.

## Comandos

| Comando                           | Uso                                      |
| --------------------------------- | ---------------------------------------- |
| `npm run dev`                     | Servidor con recarga (tsx watch)         |
| `npm run build` / `npm start`     | Compila a `dist/` / ejecuta lo compilado |
| `npm run typecheck`               | Verificación de tipos sin emitir         |
| `npm run lint` / `lint:fix`       | ESLint                                   |
| `npm run format` / `format:check` | Prettier                                 |
| `npm test` / `npm run test:watch` | Vitest                                   |

## Qué NO hacer

- No añadir datos mock ni seeds sin que se pida explícitamente. La conexión a MongoDB ya existe; si cambias el esquema, corre `npm run db:setup` y `npm run db:verify`.
- No introducir modelos Mongoose: el esquema vive en `src/database/schema/` y el acceso a datos en `getCollection<T>()`.
- No introducir otro framework (NestJS, Fastify…) ni cambiar a ESM sin consultarlo.
- No poner lógica de negocio en routes/controllers ni acceso a `req`/`res` en services.
- No hacer commits ni push salvo petición expresa. No subir `.env`.
- No dejar endpoints sin Swagger ni sin tests.
