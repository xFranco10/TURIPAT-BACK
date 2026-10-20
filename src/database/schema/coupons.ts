import type { CollectionSpec } from './types';
import { string, date, objectId, object, nullable, businessDate } from './fields';

export const coupons: CollectionSpec = {
  name: 'coupons',
  validator: object({
    required: [
      'code',
      'promotionId',
      'placeId',
      'ownerId',
      'status',
      'issuedAt',
      'issueDay',
      'expiresAt',
    ],
    properties: {
      _id: objectId(),
      // Alfabeto sin caracteres confundibles: se dicta en voz alta en la caja.
      code: string({ pattern: '^[A-Z0-9]{6,16}$' }),
      promotionId: objectId(),
      placeId: objectId(),
      ownerId: objectId(),
      status: { enum: ['issued', 'redeemed', 'expired', 'voided'] },
      issuedAt: date(),
      issueDay: businessDate(),
      expiresAt: date(),
      redeemedAt: nullable(date()),
      redeemedById: nullable(objectId()),
      redemptionChannel: nullable({ enum: ['manual', 'scan'] }),
      itineraryId: nullable(objectId()),
      createdAt: date(),
    },
    // Un cupón redimido debe registrar cuándo y quién lo canjeó (RF-20).
    anyOf: [
      {
        properties: { status: { enum: ['redeemed'] } },
        required: ['redeemedAt', 'redeemedById'],
      },
      { properties: { status: { enum: ['issued', 'expired', 'voided'] } } },
    ],
  }),
  indexes: [
    { key: { code: 1 }, options: { name: 'coupon_code_unique', unique: true } },
    {
      key: { ownerId: 1, status: 1, issuedAt: -1 },
      options: { name: 'coupon_owner_status_issued' },
    },
    { key: { promotionId: 1, issueDay: 1 }, options: { name: 'coupon_promotion_issue_day' } },
    {
      // R13: un turista no puede tener dos cupones vigentes del mismo comercio.
      key: { ownerId: 1, placeId: 1 },
      options: {
        name: 'coupon_active_per_business',
        unique: true,
        partialFilterExpression: { status: 'issued' },
      },
    },
  ],
};
