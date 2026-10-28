import type { AuthenticatedUser } from './auth';

declare global {
  namespace Express {
    interface Request {
      /**
       * Lo deja `authenticate` (historia H2.6) después de verificar el access token.
       * `undefined` significa petición anónima: `authorize` responde 401.
       */
      user?: AuthenticatedUser;
    }
  }
}

export {};
