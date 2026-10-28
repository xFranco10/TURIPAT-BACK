import express from 'express';
import { mongo } from 'mongoose';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { exampleRouter } from '../../modules/example/example.routes';
import type { AccountRole } from '../types/auth';
import { authorize } from './authorize';
import { errorHandler } from './error-handler';

/**
 * El andamiaje se valida contra el router didáctico `example`, no contra un endpoint
 * de producto: aquí solo se comprueba que `authorize` corta o deja pasar.
 *
 * `authenticate` (H2.6) todavía no existe, así que el usuario se inyecta con una
 * cabecera. Cuando exista, este archivo se cambia por un token real.
 */
const buildApp = (...roles: AccountRole[]) => {
  const app = express();
  app.use(express.json());

  app.use((req, _res, next) => {
    const role = req.header('x-test-role') as AccountRole | undefined;
    if (role) {
      req.user = {
        accountId: new mongo.ObjectId(),
        role,
        sessionId: new mongo.ObjectId(),
      };
    }
    next();
  });

  app.use(authorize(...roles));
  app.use(exampleRouter);
  app.use(errorHandler);

  return app;
};

describe('authorize', () => {
  it('responde 401 con el formato de error si no hay usuario', async () => {
    const res = await request(buildApp()).get('/examples');

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ success: false, error: { code: 'UNAUTHORIZED' } });
  });

  it('responde 403 si el rol no está permitido', async () => {
    const res = await request(buildApp('admin')).get('/examples').set('x-test-role', 'tourist');

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ success: false, error: { code: 'FORBIDDEN' } });
  });

  it('deja pasar al endpoint de example con el rol permitido', async () => {
    const res = await request(buildApp('admin')).get('/examples').set('x-test-role', 'admin');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('sin roles exige sesión pero admite cualquier rol', async () => {
    const res = await request(buildApp()).get('/examples').set('x-test-role', 'merchant');

    expect(res.status).toBe(200);
  });
});
