import type { CollectionSpec } from './types';

export type { CollectionSpec, IndexSpec, JsonSchema } from './types';
import { accounts } from './accounts';
import { categories } from './categories';
import { places } from './places';
import { itineraries } from './itineraries';
import { checkins } from './checkins';
import { affluencePings } from './affluencePings';
import { ratings } from './ratings';
import { promotions } from './promotions';
import { coupons } from './coupons';
import { promotionCounters } from './promotionCounters';
import { dailyMetrics } from './dailyMetrics';
import { sessions } from './sessions';

/**
 * Las 12 colecciones del modelo, indexadas por su nombre.
 * El objeto es la única fuente de verdad del nombre: `CollectionName` sale de sus claves
 * y `collections` de sus valores, así que no hay dos listas que puedan desincronizarse.
 */
export const collectionSpecs = {
  accounts,
  categories,
  places,
  itineraries,
  checkins,
  affluencePings,
  ratings,
  promotions,
  coupons,
  promotionCounters,
  dailyMetrics,
  sessions,
} as const;

/** Nombre válido de colección, para tipar `getCollection<T>()`. */
export type CollectionName = keyof typeof collectionSpecs;

/** Las 12 colecciones en el orden del documento de diseño. */
export const collections: CollectionSpec[] = Object.values(collectionSpecs);
