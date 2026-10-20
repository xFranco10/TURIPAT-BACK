import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../app';

const app = createApp();

describe('GET /api/v1/health', () => {
  it('responde 200 con el estado del servicio', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });

  it('responde 404 con el formato de error estándar en rutas inexistentes', async () => {
    const res = await request(app).get('/api/v1/no-existe');

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } });
  });

  it('informa el estado de la base de datos aunque no haya conexión establecida', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.data.db).toBe('disconnected');
  });
});
