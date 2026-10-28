# Arquitectura de TURIPAT-BACK

Documento de referencia de la estructura y las decisiones del backend. Las reglas resumidas que se cargan en cada sesión de Claude están en [CLAUDE.md](../CLAUDE.md); aquí está el detalle.

## 1. Visión general

API REST en Node.js + Express 5 + TypeScript que sirve a la PWA de TURIPAT. Se organiza **por módulos de dominio** (feature-based): cada carpeta de `src/modules/` contiene todo lo necesario para un área funcional, siguiendo el patrón en capas `routes → controller → service → (modelo/BD)`.

```
Cliente (PWA Angular)
      │  HTTP/JSON
      ▼
 app.ts ── helmet · cors · json · morgan ──► routes.ts ──► <modulo>.routes
                                                              │ validate(Zod)
                                                              ▼
                                                        <modulo>.controller
                                                              │
                                                              ▼
                                                        <modulo>.service ──► getCollection<T>() ──► MongoDB
      ▲
      └── notFoundHandler ─► errorHandler (formato de error uniforme)
```

El acceso a datos usa el **driver nativo** a través de `getCollection<T>()`; no hay modelos Mongoose. El esquema vive en Mongo como `$jsonSchema` (`src/database/schema/`) y la entrada se valida con Zod en el borde.

## 2. Árbol de carpetas

```
TURIPAT-BACK/
├─ CLAUDE.md                 # reglas cargadas automáticamente por Claude
├─ README.md                 # cómo instalar, compilar y ejecutar
├─ docs/ARCHITECTURE.md      # este documento
├─ .env.example              # plantilla de variables de entorno
├─ .nvmrc                    # versión de Node recomendada
├─ eslint.config.mjs · .prettierrc · .editorconfig
├─ tsconfig.json             # tipado (incluye tests) — usado por IDE y typecheck
├─ tsconfig.build.json       # build de producción (solo src, sin tests) → dist/
├─ vitest.config.mts
└─ src/
   ├─ server.ts              # listen + graceful shutdown
   ├─ app.ts                 # createApp()
   ├─ routes.ts              # monta los routers de cada módulo bajo API_PREFIX
   ├─ config/
   │  ├─ env.ts              # variables de entorno validadas con Zod
   │  ├─ database.ts         # conexión, desconexión y estado de Mongo
   │  └─ swagger.ts          # definición OpenAPI + búsqueda de anotaciones
   ├─ common/
   │  ├─ db/collection.ts    # getCollection<T>(): acceso tipado al driver nativo
   │  ├─ errors/app-error.ts
   │  ├─ middlewares/        # validate · not-found · error-handler · authorize
   │  ├─ utils/              # logger · response
   │  └─ types/              # auth.ts · express.d.ts (req.user)
   ├─ database/
   │  ├─ schema/             # 12 colecciones: validador $jsonSchema + índices
   │  ├─ setup.ts            # npm run db:setup  (idempotente: collMod + createIndex)
   │  └─ verify.ts           # npm run db:verify (compara la base real con la definición)
   └─ modules/
      ├─ health/             # módulo de referencia (implementado)
      ├─ example/            # plantilla didáctica de CRUD (implementada)
      ├─ auth/               # carpetas reservadas: se pueblan desde health
      ├─ catalog/            # al arrancar la primera historia de cada módulo
      ├─ places/
      ├─ itineraries/
      │  └─ engine/          # motor: sin router ni colecciones propias
      ├─ checkins/
      ├─ promotions/
      └─ analytics/
```

## 3. Responsabilidad de cada archivo de un módulo

| Archivo                  | Hace                                                                             | No hace                         |
| ------------------------ | -------------------------------------------------------------------------------- | ------------------------------- |
| `<modulo>.routes.ts`     | Declara rutas, anotaciones `@openapi`, aplica `validate()` y middlewares de auth | Lógica de negocio               |
| `<modulo>.controller.ts` | Extrae datos de `req`, llama al service, responde con `sendSuccess`              | Reglas de negocio, acceso a BD  |
| `<modulo>.service.ts`    | Reglas de negocio, orquestación, lanza `AppError`                                | Conocer `req`/`res`             |
| `<modulo>.model.ts`      | Interfaces del dominio y tipos compartidos del módulo (sin `_id`, que lo añade `Stored<T>`) | Definir el esquema de la BD ni el modelo Mongoose |
| `<modulo>.schema.ts`     | Esquemas Zod de entrada y tipos inferidos                                        | Validar a mano en el controller |
| `<modulo>.test.ts`       | Tests de integración con Supertest sobre `createApp()` y unitarios del service   | Depender de servicios externos  |

## 4. Contratos transversales

**Respuesta exitosa**

```json
{ "success": true, "data": {} }
```

**Respuesta de error**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Datos de entrada inválidos",
    "details": { "campo": ["mensaje"] }
  }
}
```

| Origen                                 | Status | `code`                                            |
| -------------------------------------- | ------ | ------------------------------------------------- |
| Fallo de validación Zod                | 400    | `VALIDATION_ERROR`                                |
| `AppError.badRequest`                  | 400    | `BAD_REQUEST`                                     |
| `AppError.unauthorized`                | 401    | `UNAUTHORIZED`                                    |
| `AppError.forbidden`                   | 403    | `FORBIDDEN`                                       |
| `AppError.notFound` / ruta inexistente | 404    | `NOT_FOUND`                                       |
| `AppError.conflict`                    | 409    | `CONFLICT`                                        |
| `AppError.serviceUnavailable`          | 503    | `SERVICE_UNAVAILABLE` (Mongo sin conexión)         |
| Error no controlado                    | 500    | `INTERNAL_ERROR` (mensaje genérico en producción) |

## 5. Swagger / OpenAPI

- `swagger-jsdoc` lee los bloques `@openapi` de `src/modules/**/*.routes.{ts,js}` (`.ts` en desarrollo, `.js` tras compilar).
- UI interactiva: `GET /api-docs` · especificación: `GET /api-docs.json`.
- Plantilla de anotación mínima:

```ts
/**
 * @openapi
 * /places/{id}:
 *   get:
 *     tags: [Places]
 *     summary: Obtiene un lugar por id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lugar encontrado }
 *       404:
 *         description: No encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
```

## 6. Estrategia de pruebas

- Tests junto al código (`*.test.ts`), ejecutados con Vitest.
- Integración: `request(createApp()).get(...)` con Supertest, sin levantar puerto.
- Los tests actuales **no tocan MongoDB**: el esquema se prueba sobre la definición (`database/schema/*.test.ts`) y las rutas sobre `createApp()`. Un endpoint que consulte la base se prueba con una base aislada (`mongodb-memory-server`, **pendiente de instalar**) o contra una base de test dedicada; **nunca** la de desarrollo.

## 7. Estado de la implementación

**Hecho**

1. Conexión a MongoDB (`config/database.ts`), esquema declarativo de las 12 colecciones con `$jsonSchema` e índices (`database/schema/`), `npm run db:setup` y `npm run db:verify`.
2. Acceso a datos tipado (`common/db/collection.ts`), `authorize(roles)` y `req.user` tipado (`common/types/`).
3. Módulos `health` (referencia) y `example` (didáctico).

**Pendiente** — orden en `context/agente/doc-contrato-api.md` §13

1. `authenticate` (JWT) y `auth`.
2. `places`: `GET /places` y `GET /places/:id` (rebanada vertical de S0).
3. `catalog`, `itineraries` + `engine`, `checkins`, `promotions`, `analytics`.

## 8. Decisiones tomadas

| Decisión                           | Motivo                                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| Módulos de dominio                 | Escala mejor con 26 RF agrupados por actor/área                               |
| CommonJS (`module: node16`)        | Sin fricción de extensiones `.js` en imports; compatible con Express/Mongoose |
| Express 5                          | Manejo nativo de errores async                                                |
| Zod + swagger-jsdoc                | Validación tipada y documentación junto a las rutas, enfoque común en Express |
| `createApp()` separado de `server` | Permite probar la app sin abrir un puerto                                     |
| Driver nativo (`getCollection<T>()`) | El esquema ya vive en Mongo como `$jsonSchema` y Zod valida en el borde; un modelo Mongoose sería una tercera definición que puede divergir |
| `$jsonSchema` declarativo          | Una sola definición del esquema, versionada y verificable con `db:verify`     |
