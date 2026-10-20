import { Router } from 'express';
import { validate } from '../../common/middlewares/validate';
import { createExampleSchema, idParamSchema } from './example.schema';
import {
  deleteExampleById,
  getExampleById,
  getExamples,
  postExample,
} from './example.controller';

/**
 * ROUTES — declara las rutas del módulo, la documentación @openapi
 * y aplica validate() a toda entrada externa.
 *
 * Cuando exista autenticación, añade a los endpoints privados:
 * `security: [{ bearerAuth: [] }]` en su bloque @openapi y el middleware
 * de auth correspondiente en la cadena de handlers.
 */
export const exampleRouter = Router();

/**
 * @openapi
 * /examples:
 *   get:
 *     tags: [Examples]
 *     summary: Lista todos los ejemplos
 *     responses:
 *       '200':
 *         description: Lista de ejemplos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Example' }
 */
exampleRouter.get('/examples', getExamples);

/**
 * @openapi
 * /examples:
 *   post:
 *     tags: [Examples]
 *     summary: Crea un ejemplo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, minLength: 3, maxLength: 80, example: 'Ciudadela histórica' }
 *               description: { type: string, maxLength: 500, example: 'Recorrido por el centro histórico' }
 *     responses:
 *       '201':
 *         description: Ejemplo creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Example' }
 *       '400':
 *         description: Datos de entrada inválidos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       '409':
 *         description: Límite de ejemplos alcanzado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
exampleRouter.post('/examples', validate({ body: createExampleSchema }), postExample);

/**
 * @openapi
 * /examples/{id}:
 *   get:
 *     tags: [Examples]
 *     summary: Obtiene un ejemplo por id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       '200':
 *         description: Ejemplo encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Example' }
 *       '400':
 *         description: Id con formato inválido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       '404':
 *         description: Ejemplo no encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
exampleRouter.get('/examples/:id', validate({ params: idParamSchema }), getExampleById);

/**
 * @openapi
 * /examples/{id}:
 *   delete:
 *     tags: [Examples]
 *     summary: Elimina un ejemplo
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       '204':
 *         description: Ejemplo eliminado (sin contenido)
 *       '404':
 *         description: Ejemplo no encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
exampleRouter.delete('/examples/:id', validate({ params: idParamSchema }), deleteExampleById);
