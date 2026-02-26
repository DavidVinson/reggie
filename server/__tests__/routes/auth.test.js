jest.mock('../../db', () => require('../helpers/db'));
jest.mock('@mendable/firecrawl-js');
jest.mock('../../agents/discover', () => ({
  detectSiteType: jest.fn().mockResolvedValue('direct'),
  discoverSite: jest.fn(),
}));

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../../app');
const db = require('../helpers/db');

let userId;

beforeEach(() => {
  db.prepare('DELETE FROM sessions').run();
  db.prepare('DELETE FROM users').run();

  // Seed a user with a known password — cost 1 for test speed
  const hash = bcrypt.hashSync('correctpassword', 1);
  const result = db.prepare('INSERT INTO users (password_hash) VALUES (?)').run(hash);
  userId = result.lastInsertRowid;
});

describe('POST /api/auth/login', () => {
  it('returns a session token on correct password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'correctpassword' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.token.length).toBe(64);
  });

  it('stores the session in the database', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'correctpassword' });

    const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(res.body.token);
    expect(session).toBeDefined();
    expect(session.user_id).toBe(userId);
    expect(new Date(session.expires_at) > new Date()).toBe(true);
  });

  it('returns 401 on wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid password');
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('returns 401 when no account exists', async () => {
    db.prepare('DELETE FROM users').run();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'correctpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/not configured/);
  });
});

describe('POST /api/auth/logout', () => {
  it('deletes the session from the database', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ password: 'correctpassword' });
    const { token } = loginRes.body;

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.ok).toBe(true);

    const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
    expect(session).toBeUndefined();
  });

  it('returns 200 even with no token (graceful)', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
  });
});
