import type { CollectionSpec } from './types';
import { string, integer, boolean, date, objectId, array, object, nullable, timestamps } from './fields';

export const accounts: CollectionSpec = {
  name: 'accounts',
  validator: object({
    required: ['email', 'name', 'role', 'status', 'providers'],
    properties: {
      ...timestamps(),
      _id: objectId(),
      email: string({ pattern: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$', maxLength: 254 }),
      name: string({ minLength: 1, maxLength: 120 }),
      profilePhotoUrl: nullable(string({ maxLength: 2048 })),
      role: { enum: ['tourist', 'merchant', 'admin'] },
      status: { enum: ['pendingVerification', 'active', 'suspended'] },
      emailVerified: boolean(),
      passwordHash: nullable(string()),
      providers: array(
        object({
          required: ['type'],
          properties: {
            type: { enum: ['local', 'google'] },
            // Solo los proveedores externos traen `sub`; en "local" la credencial
            // es email + passwordHash.
            sub: string({ minLength: 1 }),
            linkedAt: date(),
          },
        }),
        { minItems: 1 },
      ),
      preferences: nullable(
        object({
          properties: {
            interests: array(objectId()),
            language: string({ maxLength: 10 }),
            notifications: boolean(),
          },
        }),
      ),
      merchantProfile: nullable(
        object({
          required: ['nit', 'legalName'],
          properties: {
            nit: object({
              required: ['number', 'checkDigit'],
              properties: {
                number: string({ pattern: '^[0-9]{6,15}$' }),
                checkDigit: integer({ minimum: 0, maximum: 9 }),
                verifiedByMod11: boolean(),
                verifiedAt: nullable(date()),
              },
            }),
            legalName: string({ minLength: 1, maxLength: 200 }),
            phone: string({ maxLength: 20 }),
            contactEmail: string({ maxLength: 254 }),
          },
        }),
      ),
      lastLoginAt: nullable(date()),
      deletedAt: nullable(date()),
    },
    // Una cuenta con rol merchant debe traer merchantProfile; tourist o admin, no.
    anyOf: [
      {
        properties: {
          role: { enum: ['merchant'] },
          merchantProfile: { bsonType: 'object' },
        },
        required: ['role', 'merchantProfile'],
      },
      {
        properties: {
          role: { enum: ['tourist', 'admin'] },
          merchantProfile: { bsonType: 'null' },
        },
        required: ['role'],
      },
    ],
  }),
  indexes: [
    { key: { email: 1 }, options: { name: 'account_email_unique', unique: true } },
    {
      key: { 'providers.sub': 1 },
      options: {
        name: 'account_provider_sub_unique',
        unique: true,
        // `$type: string` y no `$exists`: los documentos "local" no llevan `sub` y un
        // nulo dentro de un índice único haría colisionar a todos entre sí.
        partialFilterExpression: { 'providers.sub': { $type: 'string' } },
      },
    },
    {
      key: { 'merchantProfile.nit.number': 1 },
      options: {
        name: 'account_nit_unique',
        unique: true,
        partialFilterExpression: { role: 'merchant' },
      },
    },
    { key: { role: 1, status: 1 }, options: { name: 'account_role_status' } },
  ],
};
