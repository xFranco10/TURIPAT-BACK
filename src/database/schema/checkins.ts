import type { CollectionSpec } from './types';
import { string, integer, date, objectId, object, nullable, businessDate, geoPoint } from './fields';

export const checkins: CollectionSpec = {
  name: 'checkins',
  validator: object({
    required: ['placeId', 'author', 'occurredAt', 'day', 'location', 'qrToken', 'result'],
    properties: {
      _id: objectId(),
      placeId: objectId(),
      author: object({
        required: ['type'],
        properties: {
          type: { enum: ['account', 'anonymous'] },
          accountId: objectId(),
          anonymousId: string({ maxLength: 64 }),
        },
      }),
      occurredAt: date(),
      day: businessDate(),
      location: geoPoint(),
      accuracyM: nullable(integer({ minimum: 0 })),
      distanceM: integer({ minimum: 0 }),
      qrToken: string({ minLength: 1, maxLength: 120 }),
      result: { enum: ['success', 'out_of_radius', 'invalid_qr', 'place_not_published'] },
      itineraryId: nullable(objectId()),
      createdAt: date(),
    },
    // El autor es una cuenta o una instalación anónima, nunca las dos ni ninguna.
    oneOf: [
      {
        properties: {
          author: {
            properties: { type: { enum: ['account'] }, accountId: objectId() },
            required: ['type', 'accountId'],
          },
        },
        required: ['author'],
      },
      {
        properties: {
          author: {
            properties: { type: { enum: ['anonymous'] }, anonymousId: string() },
            required: ['type', 'anonymousId'],
          },
        },
        required: ['author'],
      },
    ],
  }),
  indexes: [
    { key: { placeId: 1, occurredAt: -1 }, options: { name: 'checkin_place_date' } },
    {
      key: { 'author.accountId': 1, occurredAt: -1 },
      options: {
        name: 'checkin_author_account_date',
        partialFilterExpression: { 'author.accountId': { $exists: true } },
      },
    },
    { key: { day: 1 }, options: { name: 'checkin_day' } },
  ],
};
