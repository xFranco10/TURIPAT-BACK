import { describe, expect, it } from 'vitest';
import { collections, collectionSpecs } from './index';

const EXPECTED_COLLECTIONS = [
  'accounts',
  'categories',
  'places',
  'itineraries',
  'checkins',
  'affluencePings',
  'ratings',
  'promotions',
  'coupons',
  'promotionCounters',
  'dailyMetrics',
  'sessions',
];

const specOf = (name: string) => collections.find((collection) => collection.name === name);

describe('definición de colecciones', () => {
  it('define las 12 colecciones del modelo, sin duplicados ni faltantes', () => {
    const names = collections.map((collection) => collection.name);

    expect(names).toHaveLength(12);
    expect(new Set(names).size).toBe(12);
    expect([...names].sort()).toEqual([...EXPECTED_COLLECTIONS].sort());
  });

  it('la clave de collectionSpecs coincide con el name de cada spec', () => {
    for (const [key, spec] of Object.entries(collectionSpecs)) {
      expect(key).toBe(spec.name);
    }
  });

  it('toda colección trae validador $jsonSchema con bsonType object y required', () => {
    for (const collection of collections) {
      expect(collection.validator.bsonType).toBe('object');
      expect(Array.isArray(collection.validator.required)).toBe(true);
      expect((collection.validator.required as string[]).length).toBeGreaterThan(0);
    }
  });

  it('todo índice tiene clave y nombre explícito, sin repetir nombres dentro de la colección', () => {
    for (const collection of collections) {
      expect(collection.indexes.length).toBeGreaterThan(0);

      const names = collection.indexes.map((index) => index.options.name);
      expect(names.every((name) => typeof name === 'string' && name.length > 0)).toBe(true);
      expect(new Set(names).size).toBe(names.length);

      for (const index of collection.indexes) {
        expect(Object.keys(index.key).length).toBeGreaterThan(0);
      }
    }
  });

  it('incluye los índices que sostienen las reglas de negocio del modelo', () => {
    const hasIndex = (collection: string, index: string) =>
      specOf(collection)?.indexes.some((candidate) => candidate.options.name === index) === true;

    expect(hasIndex('coupons', 'coupon_active_per_business')).toBe(true);
    expect(hasIndex('places', 'place_qr_token_unique')).toBe(true);
    expect(hasIndex('itineraries', 'itinerary_client_id_unique')).toBe(true);
    expect(hasIndex('sessions', 'session_expires_ttl')).toBe(true);
    expect(hasIndex('promotionCounters', 'promotion_counter_day_unique')).toBe(true);
  });
});
