import type { JsonSchema } from './types';

export const string = (extra: JsonSchema = {}): JsonSchema => ({ bsonType: 'string', ...extra });
export const integer = (extra: JsonSchema = {}): JsonSchema => ({ bsonType: ['int', 'long'], ...extra });
export const decimal = (extra: JsonSchema = {}): JsonSchema => ({
  bsonType: ['int', 'long', 'double'],
  ...extra,
});
export const boolean = (): JsonSchema => ({ bsonType: 'bool' });
export const date = (): JsonSchema => ({ bsonType: 'date' });
export const objectId = (): JsonSchema => ({ bsonType: 'objectId' });
export const array = (items: JsonSchema, extra: JsonSchema = {}): JsonSchema => ({
  bsonType: 'array',
  items,
  ...extra,
});
export const object = (extra: JsonSchema = {}): JsonSchema => ({ bsonType: 'object', ...extra });
export const nullable = (schema: JsonSchema): JsonSchema => ({ anyOf: [{ bsonType: 'null' }, schema] });

/** Día de negocio en America/Bogota. */
export const businessDate = (): JsonSchema => string({ pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' });

/** Hora de reloj en formato 24 h. */
export const clockTime = (): JsonSchema =>
  string({ pattern: '^([01][0-9]|2[0-3]):[0-5][0-9]$' });

/**
 * GeoJSON Point. El orden es [longitud, latitud]: por eso el primer elemento
 * se acota a [-180, 180] y el segundo a [-90, 90].
 */
export const geoPoint = (): JsonSchema => ({
  bsonType: 'object',
  required: ['type', 'coordinates'],
  properties: {
    type: { enum: ['Point'] },
    coordinates: {
      bsonType: 'array',
      minItems: 2,
      maxItems: 2,
      items: [
        { bsonType: ['int', 'long', 'double'], minimum: -180, maximum: 180 },
        { bsonType: ['int', 'long', 'double'], minimum: -90, maximum: 90 },
      ],
    },
  },
});

export const timestamps = (): JsonSchema => ({
  createdAt: date(),
  updatedAt: date(),
});
