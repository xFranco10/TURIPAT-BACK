import type { ObjectId } from '../db/collection';

/** Roles de `accounts.role`. Debe coincidir con el validador de la colección. */
export type AccountRole = 'tourist' | 'merchant' | 'admin';

/**
 * Lo que `authenticate` deja en `req.user` tras verificar el access token.
 * El controller no recibe nada más de la sesión: ni el token, ni el hash, ni el correo.
 */
export interface AuthenticatedUser {
  /** `_id` de la cuenta autenticada. */
  accountId: ObjectId;
  role: AccountRole;
  /** Sesión que emitió el token; permite revocarla desde `DELETE /auth/me/sessions/:id`. */
  sessionId: ObjectId;
}
