import { describe, expect, it } from 'vitest';
import { swaggerSpec } from './swagger';

/** Un tag por grupo de endpoints del contrato, para que la UI no los mezcle. */
const MODULE_TAGS = [
  'Auth',
  'Catalog',
  'Places',
  'Itineraries',
  'Checkins',
  'Ratings',
  'Promotions',
  'Analytics',
];

const spec = swaggerSpec as {
  tags: { name: string }[];
  components: { securitySchemes: Record<string, unknown> };
};

describe('swagger', () => {
  it('declara un tag por módulo de dominio', () => {
    const tags = spec.tags.map((tag) => tag.name);

    for (const tag of MODULE_TAGS) {
      expect(tags).toContain(tag);
    }
  });

  it('mantiene el esquema de seguridad bearer para los endpoints privados', () => {
    expect(spec.components.securitySchemes).toHaveProperty('bearerAuth');
  });
});
