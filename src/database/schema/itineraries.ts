import type { CollectionSpec } from './types';
import { string, integer, boolean, date, objectId, array, object, nullable, businessDate, clockTime, geoPoint, timestamps } from './fields';

export const itineraries: CollectionSpec = {
  name: 'itineraries',
  validator: object({
    required: ['clientId', 'origin', 'status', 'parameters', 'stops', 'totals'],
    properties: {
      ...timestamps(),
      _id: objectId(),
      clientId: string({ minLength: 8, maxLength: 64 }),
      ownerId: nullable(objectId()),
      anonymousId: nullable(string({ maxLength: 64 })),
      origin: { enum: ['anonymous', 'account'] },
      status: { enum: ['active', 'saved', 'completed', 'archived'] },
      parameters: object({
        required: ['date', 'startTime', 'endTime', 'durationMinutes'],
        properties: {
          timezone: string({ maxLength: 64 }),
          date: businessDate(),
          startTime: clockTime(),
          endTime: clockTime(),
          durationMinutes: integer({ minimum: 1 }),
          interests: array(objectId()),
          originLocation: nullable(geoPoint()),
          maxRadiusM: integer({ minimum: 1 }),
        },
      }),
      stops: array(
        object({
          required: ['sortOrder', 'placeId', 'name', 'location'],
          properties: {
            sortOrder: integer({ minimum: 1, maximum: 10 }),
            placeId: objectId(),
            name: string({ minLength: 1, maxLength: 160 }),
            location: geoPoint(),
            categoryIds: array(objectId()),
            arrivalTime: clockTime(),
            durationMinutes: integer({ minimum: 0 }),
            travelMinutes: integer({ minimum: 0 }),
            distanceM: integer({ minimum: 0 }),
          },
        }),
        // RF-05 y RF-06: como máximo 10 paradas (stops) por itinerario.
        { maxItems: 10 },
      ),
      totals: object({
        required: ['stops', 'distanceM', 'durationMinutes'],
        properties: {
          stops: integer({ minimum: 0, maximum: 10 }),
          distanceM: integer({ minimum: 0 }),
          durationMinutes: integer({ minimum: 0 }),
          travelMinutes: integer({ minimum: 0 }),
          calculatedAt: date(),
        },
      }),
      optimizedByTsp: boolean(),
      optimizedAt: nullable(date()),
      savedAt: nullable(date()),
      deletedAt: nullable(date()),
    },
  }),
  indexes: [
    { key: { clientId: 1 }, options: { name: 'itinerary_client_id_unique', unique: true } },
    {
      key: { ownerId: 1, status: 1, savedAt: -1 },
      options: { name: 'itinerary_owner_status_saved' },
    },
    {
      key: { anonymousId: 1, updatedAt: -1 },
      options: {
        name: 'itinerary_anonymous_updated',
        partialFilterExpression: { anonymousId: { $type: 'string' } },
      },
    },
    {
      key: { status: 1, 'parameters.date': 1 },
      options: { name: 'itinerary_status_date' },
    },
  ],
};
