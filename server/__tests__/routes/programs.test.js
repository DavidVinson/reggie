jest.mock('../../db', () => require('../helpers/db'));
jest.mock('@mendable/firecrawl-js');
jest.mock('../../agents/discover', () => ({
  detectSiteType: jest.fn().mockResolvedValue('direct'),
  discoverSite: jest.fn(),
}));

const request = require('supertest');
const app = require('../../app');
const db = require('../helpers/db');

let siteId;

beforeAll(async () => {
  const res = await request(app)
    .post('/api/sites')
    .send({ name: 'Programs Test Site', url: 'https://programs-test.example.com', type: 'direct' });
  siteId = res.body.id;
});

describe('GET /api/programs', () => {
  it('returns empty array initially', async () => {
    const res = await request(app).get('/api/programs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('filters by site_id', async () => {
    // Insert a program directly
    db.prepare(
      'INSERT INTO programs (site_id, name, registration_status) VALUES (?, ?, ?)'
    ).run(siteId, 'Youth Soccer', 'open');

    const res = await request(app).get(`/api/programs?site_id=${siteId}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every(p => p.site_id === siteId)).toBe(true);
  });

  it('filters by status', async () => {
    db.prepare(
      'INSERT INTO programs (site_id, name, registration_status) VALUES (?, ?, ?)'
    ).run(siteId, 'Adult Volleyball', 'open');
    db.prepare(
      'INSERT INTO programs (site_id, name, registration_status) VALUES (?, ?, ?)'
    ).run(siteId, 'Senior Yoga', 'closed');

    const res = await request(app).get('/api/programs?status=open');
    expect(res.status).toBe(200);
    expect(res.body.every(p => p.registration_status === 'open')).toBe(true);
  });
});
