import type { CollectionSpec } from './types';
import { string, integer, decimal, date, objectId, object, nullable, timestamps } from './fields';

export const promotions: CollectionSpec = {
  name: 'promotions',
  validator: object({
    required: [
      'placeId',
      'ownerId',
      'title',
      'description',
      'discountType',
      'currency',
      'validity',
      'limit',
      'status',
    ],
    properties: {
      ...timestamps(),
      _id: objectId(),
      placeId: objectId(),
      ownerId: objectId(),
      title: string({ minLength: 1, maxLength: 120 }),
      description: string({ minLength: 1, maxLength: 1000 }),
      terms: string({ maxLength: 2000 }),
      discountType: { enum: ['percentage', 'amount', 'product', 'other'] },
      value: nullable(decimal({ minimum: 0 })),
      currency: string({ maxLength: 3 }),
      validity: object({ required: ['from', 'to'], properties: { from: date(), to: date() } }),
      limit: object({
        required: ['perDay', 'total'],
        properties: {
          perDay: nullable(integer({ minimum: 1 })),
          total: nullable(integer({ minimum: 1 })),
        },
      }),
      status: { enum: ['draft', 'active', 'pausada', 'finished'] },
      imageUrl: nullable(string({ maxLength: 2048 })),
    },
  }),
  indexes: [
    {
      key: { placeId: 1, status: 1, 'validity.to': -1 },
      options: { name: 'promotion_place_status_validity' },
    },
    { key: { ownerId: 1, status: 1 }, options: { name: 'promotion_owner_status' } },
  ],
};
