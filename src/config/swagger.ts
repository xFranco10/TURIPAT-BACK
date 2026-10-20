import path from 'node:path';
import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

// Las anotaciones @openapi viven en los *.routes.ts de cada módulo (.ts en dev, .js tras compilar).
// El glob debe usar "/" incluso en Windows.
const modulesGlob = path
  .join(__dirname, '..', 'modules', '**', '*.routes.{ts,js}')
  .replaceAll('\\', '/');

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'TURIPAT API',
      version: '1.0.0',
      description: 'API REST del Ecosistema Inteligente para Turismo Patrimonial.',
    },
    servers: [{ url: env.API_PREFIX, description: 'API base' }],
    tags: [
      { name: 'Health', description: 'Estado del servicio' },
      { name: 'Examples', description: 'Módulo didáctico de referencia para crear nuevos endpoints' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        Example: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '3f1a7c9e-...' },
            name: { type: 'string', example: 'Ciudadela histórica' },
            description: { type: 'string', nullable: true, example: 'Centro histórico' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Datos de entrada inválidos' },
                details: { type: 'object', nullable: true },
              },
            },
          },
        },
      },
    },
  },
  apis: [modulesGlob],
});
