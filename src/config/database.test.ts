import { describe, expect, it } from 'vitest';
import { databaseNameFromUri } from './database';

describe('databaseNameFromUri', () => {
  it('extrae el nombre de una cadena de Atlas con parámetros', () => {
    expect(
      databaseNameFromUri(
        'mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/turipat?retryWrites=true&w=majority',
      ),
    ).toBe('turipat');
  });

  it('extrae el nombre de una cadena local sin parámetros', () => {
    expect(databaseNameFromUri('mongodb://127.0.0.1:27017/turipat-test')).toBe('turipat-test');
  });

  it('devuelve vacío cuando la cadena no incluye nombre de base', () => {
    expect(
      databaseNameFromUri('mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/?retryWrites=true'),
    ).toBe('');
    expect(databaseNameFromUri('mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net')).toBe('');
    expect(databaseNameFromUri('mongodb://127.0.0.1:27017')).toBe('');
  });
});
