# TURIPAT-BACK — Reglas del proyecto para Claude

Eres un desarrollador backend experto en Node.js, Express 5 y TypeScript. Este archivo se carga en cada sesión: **síguelo siempre y no contradigas su estructura sin avisar**. Detalle ampliado en [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (léelo antes de crear un módulo nuevo o cambiar la arquitectura).

## Contexto del proyecto

Backend REST de **TURIPAT — Ecosistema Inteligente para Turismo Patrimonial**: una PWA (frontend Angular en `../TURIPAT-FRONT`) que actúa como conserje turístico. Genera itinerarios personalizados hacia negocios locales, artesanos, museos y sitios históricos para descentralizar el turismo.

Actores: **Turista** (visitante sin registro u opcionalmente autenticado), **Comerciante/Artesano** (autenticado con JWT) y **Motor inteligente** (rutas, TSP, recomendación equitativa).

### Estado actual

- Esqueleto inicial. **Sin base de datos y sin datos mock.** Solo existe el módulo de referencia `health`.
- Base de datos futura: **MongoDB** (con Mongoose). No instales ni conectes nada de BD hasta que se pida.
- Los módulos de dominio (carpetas con `.gitkeep`) están reservados pero vacíos.

### Mapa de módulos → requisitos funcionales

| Módulo (`src/modules/`) | Responsabilidad                                                                  | RF            |
| ----------------------- | -------------------------------------------------------------------------------- | ------------- |
| `auth`                  | Registro/login de turista (opcional) y comerciante, JWT, expiración de sesión    | RF-02, 15, 16 |
| `turistas`              | Perfil, historial de itinerarios, sincronización localStorage → nube             | RF-03, 04     |
| `comercios`             | Perfil cultural, horarios, coordenadas, QR del local, analíticas                 | RF-17, 18, 21 |
| `itinerarios`           | Parámetros del recorrido, generación de rutas, edición, eliminación, reemplazo   | RF-05 a 10    |
| `promociones`           | Cupones: crear, pausar, límite diario, obtener y redimir                         | RF-13, 19, 20 |
| `checkins`              | Check-in por QR + GPS (≤ 50 m) y calificación 1–5 opcional                       | RF-12, 14     |
| `motor-ia`              | Búsqueda por proximidad, TSP, redistribución por afluencia, equidad de comercios | RF-22 a 25    |

### Reglas de negocio que el código debe respetar

- Rango horario máximo **12 h/día** y máximo **10 paradas** por itinerario (RF-05/06). Validar en el schema Zod.
- El turista indica un **rango horario** (ej. 10:00–16:00), no horas sueltas; se cruza con los horarios de apertura de cada comercio.
- Mínimo **2 alternativas** de ruta sugerida. Solo comercios abiertos dentro de la ventana elegida.
- La optimización TSP se ejecuta **solo cuando el usuario la pide** (botón); reordenar a mano nunca re-optimiza (RF-08).
- NIT del comerciante: validar **dígito de verificación (módulo 11)** en el backend (RF-15).
- Check-in válido solo a **≤ 50 m** del local (RF-12). Cupones: estado `Redimido` inmediato y no reutilizable; al llegar al límite diario se ocultan hasta el día siguiente (RF-19/20).
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
├─ config/              # env.ts (Zod), swagger.ts
├─ common/              # código transversal reutilizable
│  ├─ errors/           # AppError
│  ├─ middlewares/      # validate, not-found, error-handler (+ futuros: auth, roles)
│  ├─ utils/            # logger, response
│  └─ types/            # tipos compartidos
└─ modules/<modulo>/
   ├─ <modulo>.routes.ts      # rutas + anotaciones @openapi + validate()
   ├─ <modulo>.controller.ts  # HTTP: lee req, llama al service, responde con sendSuccess
   ├─ <modulo>.service.ts     # lógica de negocio, sin tocar req/res
   ├─ <modulo>.model.ts       # interfaces/tipos del dominio (en el futuro: esquema Mongoose)
   ├─ <modulo>.schema.ts      # esquemas Zod de entrada (body/params/query) y sus tipos inferidos
   └─ <modulo>.test.ts        # tests del módulo (junto al código)
```

`src/modules/health/` es la **plantilla de referencia**: cópiala al crear un módulo nuevo.

## Convenciones

- Archivos: `kebab-case` con sufijo de rol (`comercios.service.ts`, `app-error.ts`). Clases/tipos `PascalCase`; variables y funciones `camelCase`; constantes de entorno `UPPER_SNAKE_CASE`.
- Idioma: los **términos de dominio en español** (`comercios`, `itinerarios`, `paradas`), los sufijos técnicos y el código en inglés. Campos JSON de la API en `camelCase`. Mensajes de error al cliente en español.
- Capas: `routes → controller → service`. El controller **no** contiene lógica de negocio; el service **no** conoce `req`/`res`. Cuando exista MongoDB, el acceso a datos va detrás del service (capa repositorio/modelo), nunca en el controller.
- TypeScript: prohibido `any` (usa `unknown`), prefiere inferencia cuando el tipo es obvio, `import type` para tipos, `async/await` (sin callbacks). Sin `console.*`: usa `common/utils/logger`.
- Variables de entorno: **solo** se leen desde `config/env.ts` (validadas con Zod). Toda variable nueva se añade ahí **y** en `.env.example`. Nunca `process.env` suelto ni secretos en el código.
- Rutas: prefijo `API_PREFIX` (por defecto `/api/v1`), recursos en plural y minúsculas (`/comercios/:id/promociones`). Verbos HTTP correctos y códigos de estado precisos (201 al crear, 204 al borrar, 400/401/403/404/409 según el caso).
- Formato de respuesta **siempre** uniforme:
  - Éxito: `{ "success": true, "data": ... }` (usa `sendSuccess`).
  - Error: `{ "success": false, "error": { "code", "message", "details?" } }`. Lanza `AppError` (`AppError.notFound()`, etc.); el `errorHandler` global lo formatea. No respondas errores a mano en los controllers.
- Validación: toda entrada externa pasa por `validate({ body, params, query })` con un schema Zod. Tipos de entrada = `z.infer<typeof schema>`.
- Seguridad: no filtrar stack traces en producción, no loguear datos personales ni coordenadas de turistas, endpoints privados con middleware de auth/roles, `helmet` y CORS restringido a `CORS_ORIGINS`.

## Documentación Swagger (obligatoria)

Cada endpoint nuevo **debe** llevar su bloque `@openapi` en el `*.routes.ts` del módulo (ver `health.routes.ts`): tag, summary, parámetros, `requestBody`, respuestas (incluidas las de error con `$ref: '#/components/schemas/ErrorResponse'`) y `security: [{ bearerAuth: [] }]` si es privado. Esquemas reutilizables van en `components.schemas` de `config/swagger.ts`. Añade el tag del módulo en `tags` de ese mismo archivo. UI en `/api-docs`, JSON en `/api-docs.json`.

## Flujo para añadir un módulo o endpoint

1. Copia la estructura de `src/modules/health/` (o rellena la carpeta reservada y borra su `.gitkeep`).
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

- No añadir datos mock, seeds ni conexión a BD sin que se pida explícitamente.
- No introducir otro framework (NestJS, Fastify…), ORM distinto de Mongoose, ni cambiar a ESM sin consultarlo.
- No poner lógica de negocio en routes/controllers ni acceso a `req`/`res` en services.
- No hacer commits ni push salvo petición expresa. No subir `.env`.
- No dejar endpoints sin Swagger ni sin tests.
