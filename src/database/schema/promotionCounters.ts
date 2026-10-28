import type { CollectionSpec } from './types';
import { integer, date, objectId, object, businessDate } from './fields';

export const promotionCounters: CollectionSpec = {
  name: 'promotionCounters',
  validator: object({
    required: ['promotionId', 'date', 'issued', 'redimidos'],
    properties: {
      _id: objectId(),
      promotionId: objectId(),
      date: businessDate(),
      issued: integer({ minimum: 0 }),
      redimidos: integer({ minimum: 0 }),
      updatedAt: date(),
    },
  }),
  indexes: [
    {
      key: { promotionId: 1, date: 1 },
      options: { name: 'promotion_counter_day_unique', unique: true },
    },
  ],
};
