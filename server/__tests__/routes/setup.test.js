jest.mock('../../db', () => require('../helpers/db'));
jest.mock('@mendable/firecrawl-js');
jest.mock('../../agents/discover', () => ({
  detectSiteType: jest.fn().mockResolvedValue('direct'),
  discoverSite: jest.fn(),
}));

const request = require('supertest');
const app = require('../../app');
const db = require('../helpers/db');

beforeEach(() => {
  db.prepare('DELETE FROM sessions').run();
  db.prepare('DELETE FROM users').run();
});

describe('GET /api/setup/status', () => {
  it('returns needsSetup: true when no users exist', async () => {
    const res = await request(app).get('/api/setup/status');
    expect(res.status).toBe(200);
    expect(res.body.needsSetup).toBe(true);
  });

  it('returns needsSetup: false after account is created', async () => {
    db.prepare('INSERT INTO users (password_hash) VALUES (?)').run('$2b$12$fakehash');
    const res = await request(app).get('/api/setup/status');
    expect(res.status).toBe(200);
    expect(res.body.needsSetup).toBe(false);
  });
});

describe('POST /api/setup', () => {
  it('creates account and returns a session token', async () => {
    const res = await request(app)
      .post('/api/setup')
      .send({ password: 'securepass1', phoneNumber: '+15550001234' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBe(64); // 32 bytes hex
  });

  it('stores a bcrypt hash — not the plain password', async () => {
    await request(app).post('/api/setup').send({ password: 'securepass1' });
    const user = db.prepare('SELECT * FROM users LIMIT 1').get();
    expect(user.password_hash).not.toBe('securepass1');
    expect(user.password_hash).toMatch(/^\$2[ab]\$/);
  });

  it('stores phone number when provided', async () => {
    await request(app).post('/api/setup').send({ password: 'securepass1', phoneNumber: '+15550001234' });
    const user = db.prepare('SELECT * FROM users LIMIT 1').get();
    expect(user.phone_number).toBe('+15550001234');
  });

  it('creates a valid session in the sessions table', async () => {
    const res = await request(app).post('/api/setup').send({ password: 'securepass1' });
    const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(res.body.token);
    expect(session).toBeDefined();
    expect(new Date(session.expires_at) > new Date()).toBe(true);
  });

  it('returns 400 when password is too short', async () => {
    const res = await request(app).post('/api/setup').send({ password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/8 characters/);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app).post('/api/setup').send({});
    expect(res.status).toBe(400);
  });

  it('returns 403 when account already exists', async () => {
    await request(app).post('/api/setup').send({ password: 'securepass1' });
    const res = await request(app).post('/api/setup').send({ password: 'anotherpass1' });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/already configured/);
  });
});
