import type { CollectionSpec } from './types';
import { string, integer, boolean, objectId, array, object, nullable, timestamps } from './fields';

export const categories: CollectionSpec = {
  name: 'categories',
  validator: object({
    required: ['code', 'name', 'appliesTo', 'active'],
    properties: {
      ...timestamps(),
      _id: objectId(),
      code: string({ pattern: '^[a-z0-9-]+$', maxLength: 60 }),
      name: string({ minLength: 1, maxLength: 80 }),
      description: string({ maxLength: 300 }),
      icon: nullable(string({ maxLength: 2048 })),
      appliesTo: array({ enum: ['heritage', 'business'] }, { minItems: 1 }),
      sortOrder: integer({ minimum: 0 }),
      active: boolean(),
      createdById: objectId(),
    },
  }),
  indexes: [
    { key: { code: 1 }, options: { name: 'category_code_unique', unique: true } },
    { key: { active: 1, sortOrder: 1 }, options: { name: 'category_active_sort_order' } },
  ],
};
