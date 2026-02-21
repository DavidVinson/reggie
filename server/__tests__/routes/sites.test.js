jest.mock('../../db', () => require('../helpers/db'));
jest.mock('@mendable/firecrawl-js');
jest.mock('../../agents/discover', () => ({
  detectSiteType: jest.fn().mockResolvedValue('direct'),
  discoverSite: jest.fn(),
}));

const request = require('supertest');
const app = require('../../app');

describe('GET /api/sites', () => {
  it('returns empty array initially', async () => {
    const res = await request(app).get('/api/sites');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('POST /api/sites', () => {
  it('adds a site and returns it', async () => {
    const res = await request(app)
      .post('/api/sites')
      .send({ name: 'Test Parks', url: 'https://testparks.example.com' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: 'Test Parks',
      url: 'https://testparks.example.com',
      type: 'direct',
    });
    expect(res.body.id).toBeDefined();
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/sites')
      .send({ url: 'https://testparks.example.com' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when url is missing', async () => {
    const res = await request(app)
      .post('/api/sites')
      .send({ name: 'No URL Site' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/sites/:id', () => {
  let siteId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/sites')
      .send({ name: 'Get By ID Site', url: 'https://getbyid.example.com', type: 'direct' });
    siteId = res.body.id;
  });

  it('returns the site by id', async () => {
    const res = await request(app).get(`/api/sites/${siteId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(siteId);
    expect(res.body.name).toBe('Get By ID Site');
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/sites/99999');
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/sites/:id', () => {
  let siteId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/sites')
      .send({ name: 'Delete Me', url: 'https://deleteme.example.com', type: 'direct' });
    siteId = res.body.id;
  });

  it('removes the site', async () => {
    const del = await request(app).delete(`/api/sites/${siteId}`);
    expect(del.status).toBe(200);
    expect(del.body.ok).toBe(true);

    const get = await request(app).get(`/api/sites/${siteId}`);
    expect(get.status).toBe(404);
  });

  it('returns 404 for already-deleted site', async () => {
    const res = await request(app).delete(`/api/sites/${siteId}`);
    expect(res.status).toBe(404);
  });
});
