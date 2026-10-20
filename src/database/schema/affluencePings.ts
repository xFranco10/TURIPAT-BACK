import type { CollectionSpec } from './types';
import { string, date, objectId, array, object, nullable, businessDate, clockTime } from './fields';

export const affluencePings: CollectionSpec = {
  name: 'affluencePings',
  validator: object({
    required: ['date', 'window', 'placeIds', 'expiresAt'],
    properties: {
      _id: objectId(),
      anonymousId: nullable(string({ maxLength: 64 })),
      accountId: nullable(objectId()),
      date: businessDate(),
      window: object({
        required: ['startTime', 'endTime'],
        properties: { startTime: clockTime(), endTime: clockTime() },
      }),
      placeIds: array(objectId(), { minItems: 1, maxItems: 10 }),
      updatedAt: date(),
      expiresAt: date(),
    },
    // La señal viene de un dispositivo anónimo (anonymousId) o de una cuenta (accountId).
    anyOf: [{ required: ['anonymousId'] }, { required: ['accountId'] }],
  }),
  indexes: [
    {
      key: { anonymousId: 1, date: 1 },
      options: {
        name: 'ping_anonymous_day_unique',
        unique: true,
        partialFilterExpression: { anonymousId: { $type: 'string' } },
      },
    },
    {
      key: { accountId: 1, date: 1 },
      options: {
        name: 'ping_account_day_unique',
        unique: true,
        partialFilterExpression: { accountId: { $type: 'objectId' } },
      },
    },
    { key: { date: 1, placeIds: 1 }, options: { name: 'ping_date_places' } },
    { key: { expiresAt: 1 }, options: { name: 'ping_expires_ttl', expireAfterSeconds: 0 } },
  ],
};
