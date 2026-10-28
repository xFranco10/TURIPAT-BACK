import type { CollectionSpec } from './types';
import { integer, decimal, date, objectId, object, businessDate } from './fields';

export const dailyMetrics: CollectionSpec = {
  name: 'dailyMetrics',
  validator: object({
    required: [
      'placeId',
      'date',
      'checkins',
      'couponsIssued',
      'couponsRedeemed',
      'ratings',
    ],
    properties: {
      _id: objectId(),
      placeId: objectId(),
      date: businessDate(),
      checkins: integer({ minimum: 0 }),
      couponsIssued: integer({ minimum: 0 }),
      couponsRedeemed: integer({ minimum: 0 }),
      ratings: object({
        required: ['n', 'suma'],
        properties: {
          n: integer({ minimum: 0 }),
          suma: integer({ minimum: 0 }),
          promedio: decimal({ minimum: 0, maximum: 5 }),
        },
      }),
      itinerariesIncluding: integer({ minimum: 0 }),
      updatedAt: date(),
    },
  }),
  indexes: [
    { key: { placeId: 1, date: 1 }, options: { name: 'metric_place_day_unique', unique: true } },
    { key: { date: 1 }, options: { name: 'metric_date' } },
  ],
};
