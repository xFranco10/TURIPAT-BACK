import { describe, expect, it } from 'vitest';
import { AppError } from '../errors/app-error';
import { getCollection } from './collection';

/**
 * Sin conexión, el helper debe fallar con 503 y no con un TypeError críptico.
 * La consulta real contra Mongo se prueba cuando exista el primer endpoint de
 * dominio; aquí solo se valida el contrato del helper.
 */
const captureError = (): unknown => {
  try {
    getCollection('places');
    return null;
  } catch (error) {
    return error;
  }
};

describe('getCollection', () => {
  it('lanza 503 SERVICE_UNAVAILABLE si todavía no hay conexión', () => {
    const error = captureError();

    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ statusCode: 503, code: 'SERVICE_UNAVAILABLE' });
  });
});
