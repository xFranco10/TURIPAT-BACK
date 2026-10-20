import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../app';

const app = createApp();

/** El service guarda en memoria: cada test crea sus propios datos. */
describe('GET /api/v1/examples', () => {
  it('responde 200 con una lista', async () => {
    const res = await request(app).get('/api/v1/examples');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('POST /api/v1/examples', () => {
  it('crea un ejemplo y responde 201 con el recurso', async () => {
    const res = await request(app)
      .post('/api/v1/examples')
      .send({ name: 'Ciudadela histórica', description: 'Centro histórico' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ name: 'Ciudadela histórica' });
    expect(res.body.data.id).toEqual(expect.any(String));
  });

  it('valida el body con Zod y responde 400 con el formato de error', async () => {
    const res = await request(app).post('/api/v1/examples').send({ name: 'ab' });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false, error: { code: 'VALIDATION_ERROR' } });
  });
});

describe('GET /api/v1/examples/:id', () => {
  it('responde 404 con el formato de error cuando el id no existe', async () => {
    const res = await request(app).get('/api/v1/examples/00000000-0000-4000-8000-000000000000');

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } });
  });

  it('rechaza un id con formato inválido y responde 400', async () => {
    const res = await request(app).get('/api/v1/examples/no-uuid');

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false, error: { code: 'VALIDATION_ERROR' } });
  });
});

describe('DELETE /api/v1/examples/:id', () => {
  it('crea y luego borra un ejemplo respondiendo 204 sin cuerpo', async () => {
    const creado = await request(app).post('/api/v1/examples').send({ name: 'Para borrar' });
    const { id } = creado.body.data as { id: string };

    const res = await request(app).delete(`/api/v1/examples/${id}`);

    expect(res.status).toBe(204);
    expect(res.text).toBe('');

    const trasBorrar = await request(app).get(`/api/v1/examples/${id}`);
    expect(trasBorrar.status).toBe(404);
  });
});
