import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

interface ValidationSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

/**
 * Valida body/query/params con Zod. Si falla, el error de Zod llega al errorHandler (400).
 * En Express 5 `req.query` es de solo lectura, por eso se redefine con defineProperty.
 */
export const validate =
  (schemas: ValidationSchemas): RequestHandler =>
  (req, _res, next) => {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    if (schemas.params) {
      Object.assign(req.params, schemas.params.parse(req.params));
    }
    if (schemas.query) {
      const query = schemas.query.parse(req.query);
      Object.defineProperty(req, 'query', { value: query, writable: true, configurable: true });
    }
    next();
  };
