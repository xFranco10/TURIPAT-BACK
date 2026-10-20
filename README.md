# TURIPAT-BACK

Backend REST del **Ecosistema Inteligente para Turismo Patrimonial (TURIPAT)**. Sirve a la PWA ([TURIPAT-FRONT](../TURIPAT-FRONT)) y expone la lógica de turistas, comerciantes locales, itinerarios y el motor inteligente de rutas.

> Estado: esqueleto inicial. Sin base de datos ni datos mock; MongoDB se integrará más adelante.

## Requisitos

| Herramienta | Versión                                     |
| ----------- | ------------------------------------------- |
| Node.js     | **≥ 22** (recomendado **24**, ver `.nvmrc`) |
| npm         | ≥ 10                                        |
| MongoDB     | No requerido todavía                        |

Con [nvm](https://github.com/nvm-sh/nvm) / nvm-windows: `nvm install 24 && nvm use 24`.

## Puesta en marcha

```bash
npm install
cp .env.example .env      # en PowerShell: Copy-Item .env.example .env
npm run dev
```

- API: http://localhost:3000/api/v1
- Health check: http://localhost:3000/api/v1/health
- Swagger UI: http://localhost:3000/api-docs

## Compilar y ejecutar en producción

```bash
npm run build     # transpila src/ a dist/
npm start         # ejecuta dist/server.js
```

## Scripts

| Script                            | Descripción                              |
| --------------------------------- | ---------------------------------------- |
| `npm run dev`                     | Servidor en desarrollo con recarga (tsx) |
| `npm run build`                   | Compila TypeScript a `dist/`             |
| `npm start`                       | Ejecuta la versión compilada             |
| `npm run typecheck`               | Verifica tipos sin generar archivos      |
| `npm run lint` / `lint:fix`       | Analiza (y corrige) con ESLint           |
| `npm run format` / `format:check` | Formatea / verifica con Prettier         |
| `npm test` / `npm run test:watch` | Pruebas con Vitest + Supertest           |

## Variables de entorno

Definidas y validadas en [src/config/env.ts](src/config/env.ts). Plantilla en [.env.example](.env.example).

| Variable       | Por defecto             | Descripción                             |
| -------------- | ----------------------- | --------------------------------------- |
| `NODE_ENV`     | `development`           | `development`, `test` o `production`    |
| `PORT`         | `3000`                  | Puerto HTTP                             |
| `API_PREFIX`   | `/api/v1`               | Prefijo de todas las rutas de la API    |
| `CORS_ORIGINS` | `http://localhost:4200` | Orígenes permitidos, separados por coma |

## Estructura

```
src/
├─ server.ts · app.ts · routes.ts
├─ config/        # env, swagger
├─ common/        # errors, middlewares, utils, types
└─ modules/       # un directorio por dominio (routes/controller/service/model/schema/test)
```

Detalle completo, convenciones y flujo para añadir módulos: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Para trabajar con Claude Code

[CLAUDE.md](CLAUDE.md) contiene las reglas de estructura, buenas prácticas y contexto del negocio; Claude Code lo carga automáticamente en cada sesión dentro de este repositorio. Si cambias la arquitectura o las convenciones, actualiza ese archivo.

## Stack

Node.js · Express 5 · TypeScript · Zod · swagger-jsdoc / swagger-ui-express · helmet · cors · morgan · Vitest · Supertest · ESLint · Prettier. Base de datos prevista: MongoDB.
