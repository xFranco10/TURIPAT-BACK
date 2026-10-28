import type { RequestHandler } from 'express';
import { AppError } from '../errors/app-error';
import type { AccountRole } from '../types/auth';

/**
 * Exige sesión y, opcionalmente, uno de los roles indicados.
 *
 * - `authorize()` → solo autenticado, cualquier rol.
 * - `authorize('admin')` → solo admin.
 * - `authorize('merchant', 'admin')` → dueño o admin (el service decide la propiedad).
 *
 * No verifica tokens: eso es de `authenticate`, que corre antes y rellena `req.user`.
 * Sin `req.user` la respuesta es 401; con rol insuficiente, 403.
 */
export const authorize =
  (...roles: AccountRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      next(AppError.unauthorized());
      return;
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      next(AppError.forbidden());
      return;
    }
    next();
  };
