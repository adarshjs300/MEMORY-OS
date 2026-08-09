/**
 * Integration tests for the auth flow.
 *
 * These hit a real Postgres database — set DATABASE_URL (e.g. to a
 * disposable `digital_memory_os_test` database) before running:
 *
 *   DATABASE_URL=postgresql://dmos_user:dmos_password@localhost:5432/digital_memory_os_test \
 *     npm test
 *
 * Run `npm run migrate` against that same test database first.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';

const app = createApp();

const testUser = {
  email: `test.${Date.now()}@example.com`,
  password: 'StrongPass123',
  displayName: 'Test User',
};

describe('Auth flow', () => {
  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', [testUser.email]);
    await pool.end();
  });

  it('registers a new user and returns an access token + user object', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.headers['set-cookie']?.[0]).toMatch(/dmos_refresh_token/);
  });

  it('rejects registering the same email twice', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(409);
  });

  it('rejects weak passwords', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'weak@example.com', password: 'weak', displayName: 'Weak' });
    expect(res.status).toBe(400);
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
  });

  it('rejects login with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: 'WrongPassword123',
    });
    expect(res.status).toBe(401);
  });

  it('returns the current user from /me with a valid access token', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });
    const { accessToken } = loginRes.body;

    const meRes = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe(testUser.email);
  });

  it('rejects /me without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('refreshes tokens using the refresh cookie', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });
    const cookie = loginRes.headers['set-cookie'][0];

    const refreshRes = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.accessToken).toBeTruthy();
  });
});
