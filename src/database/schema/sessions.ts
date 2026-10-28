import type { CollectionSpec } from './types';
import { string, date, objectId, object, nullable } from './fields';

export const sessions: CollectionSpec = {
  name: 'sessions',
  validator: object({
    required: ['accountId', 'familyId', 'tokenHash', 'issuedAt', 'expiresAt', 'lastUsedAt'],
    properties: {
      _id: objectId(),
      accountId: objectId(),
      familyId: string({ minLength: 8, maxLength: 64 }),
      // SHA-256 en hexadecimal: el token en claro nunca se guarda.
      tokenHash: string({ pattern: '^[a-f0-9]{64}$' }),
      issuedAt: date(),
      expiresAt: date(),
      lastUsedAt: date(),
      revokedAt: nullable(date()),
      revocationReason: nullable({
        enum: ['logout', 'inactivity', 'reuse', 'administrative'],
      }),
      device: nullable(
        object({
          properties: {
            userAgent: string({ maxLength: 500 }),
            platform: string({ maxLength: 100 }),
          },
        }),
      ),
      ipHash: nullable(string({ maxLength: 64 })),
    },
  }),
  indexes: [
    { key: { tokenHash: 1 }, options: { name: 'session_token_hash_unique', unique: true } },
    { key: { expiresAt: 1 }, options: { name: 'session_expires_ttl', expireAfterSeconds: 0 } },
    { key: { accountId: 1, revokedAt: 1 }, options: { name: 'session_account_revoked' } },
    { key: { familyId: 1, revokedAt: 1 }, options: { name: 'session_family_revoked' } },
  ],
};
