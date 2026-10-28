import type { CollectionSpec } from './types';
import { string, integer, decimal, boolean, date, objectId, array, object, nullable, businessDate, clockTime, geoPoint, timestamps } from './fields';

export const places: CollectionSpec = {
  name: 'places',
  validator: object({
    required: [
      'type',
      'name',
      'shortDescription',
      'address',
      'location',
      'categories',
      'openingHours',
      'averageVisitMinutes',
      'status',
      'metrics',
    ],
    properties: {
      ...timestamps(),
      _id: objectId(),
      type: { enum: ['heritage', 'business'] },
      name: string({ minLength: 1, maxLength: 160 }),
      shortDescription: string({ minLength: 1, maxLength: 160 }),
      culturalDescription: string({ maxLength: 5000 }),
      address: object({
        required: ['line', 'city'],
        properties: {
          line: string({ minLength: 1, maxLength: 200 }),
          city: string({ minLength: 1, maxLength: 100 }),
          state: string({ maxLength: 100 }),
          country: string({ maxLength: 100 }),
          reference: string({ maxLength: 200 }),
        },
      }),
      location: geoPoint(),
      categories: array(objectId(), { minItems: 1 }),
      photos: array(
        object({
          required: ['url'],
          properties: {
            url: string({ minLength: 1, maxLength: 2048 }),
            alt: string({ maxLength: 200 }),
            sortOrder: integer({ minimum: 0 }),
            credit: string({ maxLength: 200 }),
          },
        }),
      ),
      openingHours: array(
        object({
          required: ['weekday'],
          properties: {
            weekday: integer({ minimum: 1, maximum: 7 }),
            // Jornada partida: varios tramos (slots) por día. Día cerrado = sin tramos.
            slots: array(
              object({
                required: ['opensAt', 'closesAt'],
                properties: { opensAt: clockTime(), closesAt: clockTime() },
              }),
            ),
          },
        }),
      ),
      exceptions: array(
        object({
          required: ['date'],
          properties: {
            date: businessDate(),
            closed: boolean(),
            slots: array(
              object({
                required: ['opensAt', 'closesAt'],
                properties: { opensAt: clockTime(), closesAt: clockTime() },
              }),
            ),
          },
        }),
      ),
      averageVisitMinutes: integer({ minimum: 0, maximum: 600 }),
      contact: nullable(
        object({
          properties: {
            phone: string({ maxLength: 20 }),
            whatsapp: string({ maxLength: 20 }),
            website: string({ maxLength: 2048 }),
          },
        }),
      ),
      ownerId: nullable(objectId()),
      qr: nullable(
        object({
          required: ['token'],
          properties: {
            token: string({ minLength: 1, maxLength: 120 }),
            version: integer({ minimum: 1 }),
            generatedAt: date(),
            active: boolean(),
          },
        }),
      ),
      status: { enum: ['draft', 'published', 'paused', 'archived'] },
      publishedAt: nullable(date()),
      metrics: object({
        required: ['averageRating', 'totalRatings', 'totalCheckins', 'popularity'],
        properties: {
          averageRating: decimal({ minimum: 0, maximum: 5 }),
          totalRatings: integer({ minimum: 0 }),
          totalCheckins: integer({ minimum: 0 }),
          popularity: decimal({ minimum: 0, maximum: 1 }),
          updatedAt: date(),
        },
      }),
      createdById: objectId(),
      deletedAt: nullable(date()),
    },
    // tipo heritage: sin dueño ni QR. tipo business: ambos obligatorios.
    anyOf: [
      {
        properties: {
          type: { enum: ['heritage'] },
          ownerId: { bsonType: 'null' },
          qr: { bsonType: 'null' },
        },
        required: ['type'],
      },
      {
        properties: {
          type: { enum: ['business'] },
          ownerId: objectId(),
          qr: object({ required: ['token'] }),
        },
        required: ['type', 'ownerId', 'qr'],
      },
    ],
  }),
  indexes: [
    { key: { location: '2dsphere' }, options: { name: 'place_location_2dsphere' } },
    {
      key: { 'qr.token': 1 },
      options: {
        name: 'place_qr_token_unique',
        unique: true,
        partialFilterExpression: { type: 'business' },
      },
    },
    {
      key: { status: 1, type: 1, categories: 1 },
      options: { name: 'place_status_type_categories' },
    },
    { key: { ownerId: 1, status: 1 }, options: { name: 'place_owner_status' } },
    {
      key: { name: 'text', culturalDescription: 'text' },
      options: { name: 'place_text_search' },
    },
  ],
};
