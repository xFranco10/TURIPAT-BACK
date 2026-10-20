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
                                                        <modulo>.service ──► (futuro) MongoDB
      ▲
      └── notFoundHandler ─► errorHandler (formato de error uniforme)
```

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
   │  └─ swagger.ts          # definición OpenAPI + búsqueda de anotaciones
   ├─ common/
   │  ├─ errors/app-error.ts
   │  ├─ middlewares/        # validate · not-found · error-handler
   │  ├─ utils/              # logger · response
   │  └─ types/
   └─ modules/
      ├─ health/             # módulo de referencia (implementado)
      ├─ auth/               # reservado
      ├─ turistas/           # reservado
      ├─ comercios/          # reservado
      ├─ itinerarios/        # reservado
      ├─ promociones/        # reservado
      ├─ checkins/           # reservado
      └─ motor-ia/           # reservado
```

## 3. Responsabilidad de cada archivo de un módulo

| Archivo                  | Hace                                                                             | No hace                         |
| ------------------------ | -------------------------------------------------------------------------------- | ------------------------------- |
| `<modulo>.routes.ts`     | Declara rutas, anotaciones `@openapi`, aplica `validate()` y middlewares de auth | Lógica de negocio               |
| `<modulo>.controller.ts` | Extrae datos de `req`, llama al service, responde con `sendSuccess`              | Reglas de negocio, acceso a BD  |
| `<modulo>.service.ts`    | Reglas de negocio, orquestación, lanza `AppError`                                | Conocer `req`/`res`             |
| `<modulo>.model.ts`      | Tipos del dominio; con MongoDB será el esquema/modelo Mongoose                   | Lógica de negocio               |
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
| Error no controlado                    | 500    | `INTERNAL_ERROR` (mensaje genérico en producción) |

## 5. Swagger / OpenAPI

- `swagger-jsdoc` lee los bloques `@openapi` de `src/modules/**/*.routes.{ts,js}` (`.ts` en desarrollo, `.js` tras compilar).
- UI interactiva: `GET /api-docs` · especificación: `GET /api-docs.json`.
- Plantilla de anotación mínima:

```ts
/**
 * @openapi
 * /comercios/{id}:
 *   get:
 *     tags: [Comercios]
 *     summary: Obtiene un comercio por id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Comercio encontrado }
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
- Cuando exista MongoDB: usar una BD aislada para tests (p. ej. `mongodb-memory-server`) y nunca la de desarrollo.

## 7. Hoja de ruta prevista (no implementada)

1. Conexión a MongoDB con Mongoose (`config/database.ts`) y modelos por módulo; índice `2dsphere` en la ubicación de los comercios.
2. `auth`: registro/login con bcrypt + JWT, middleware `authenticate` y `authorize(roles)` en `common/middlewares/`.
3. `comercios` (con validación de NIT módulo 11, QR) y `promociones`.
4. `itinerarios` + `motor-ia` (TSP asíncrono, equidad de comercios, afluencia).
5. `checkins` y analíticas anónimas.

## 8. Decisiones tomadas

| Decisión                           | Motivo                                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| Módulos de dominio                 | Escala mejor con 25 RF agrupados por actor/área                               |
| CommonJS (`module: node16`)        | Sin fricción de extensiones `.js` en imports; compatible con Express/Mongoose |
| Express 5                          | Manejo nativo de errores async                                                |
| Zod + swagger-jsdoc                | Validación tipada y documentación junto a las rutas, enfoque común en Express |
| `createApp()` separado de `server` | Permite probar la app sin abrir un puerto                                     |
| Sin mock ni BD por ahora           | Pedido explícito: esqueleto inicial; la BD será MongoDB                       |
