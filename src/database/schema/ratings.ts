import type { CollectionSpec } from './types';
import { string, integer, objectId, object, nullable, timestamps } from './fields';

export const ratings: CollectionSpec = {
  name: 'ratings',
  validator: object({
    required: ['placeId', 'authorId', 'checkinId', 'stars', 'status'],
    properties: {
      ...timestamps(),
      _id: objectId(),
      placeId: objectId(),
      authorId: objectId(),
      checkinId: objectId(),
      stars: integer({ minimum: 1, maximum: 5 }),
      comment: nullable(string({ maxLength: 1000 })),
      status: { enum: ['published', 'hidden'] },
    },
  }),
  indexes: [
    { key: { placeId: 1, authorId: 1 }, options: { name: 'rating_place_author_unique', unique: true } },
    { key: { placeId: 1, status: 1 }, options: { name: 'rating_place_status' } },
  ],
};
