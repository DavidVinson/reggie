const { Router } = require('express');
const { FirecrawlAppV1: FirecrawlApp } = require('@mendable/firecrawl-js');
const db = require('../db');

const router = Router();

router.get('/', (req, res) => {
  const sites = db.prepare('SELECT * FROM sites ORDER BY created_at DESC').all();
  res.json(sites);
});

const NOISE_DOMAINS = [
  // Social media
  'facebook.com', 'instagram.com', 'twitter.com', 'x.com',
  'youtube.com', 'linkedin.com', 'tiktok.com', 'pinterest.com',
  // Publishing / doc platforms
  'issuu.com', 'scribd.com', 'slideshare.net',
  // Review / discovery
  'yelp.com', 'tripadvisor.com', 'eventbrite.com', 'meetup.com',
  // News / blogs
  'patch.com', 'nextdoor.com',
];

function isNoiseDomain(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return NOISE_DOMAINS.some(d => host === d || host.endsWith('.' + d));
  } catch {
    return false;
  }
}

router.post('/search', async (req, res) => {
  const { city, state } = req.body;
  if (!city || !state || typeof city !== 'string' || typeof state !== 'string') {
    return res.status(400).json({ error: 'city and state are required strings' });
  }

  try {
    const { detectSiteType } = require('../agents/discover');
    const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

    const query = `parks recreation activity programs ${city.trim()} ${state.trim()}`;
    const searchRes = await firecrawl.search(query, { limit: 10 });
    const rawResults = searchRes.data || searchRes.results || searchRes || [];

    const results = await Promise.all(
      rawResults.map(async (r) => {
        const url = r.url || r.link || '';
        const type = await detectSiteType(url);
        return {
          name: r.title || r.name || url,
          url,
          description: r.description || r.snippet || '',
          type,
        };
      })
    );

    // Deduplicate by hostname — keep the shortest path (root) per domain, skip noise
    const byHost = new Map();
    for (const r of results) {
      if (!r.url || isNoiseDomain(r.url)) continue;
      try {
        const host = new URL(r.url).hostname.replace(/^www\./, '');
        const existing = byHost.get(host);
        if (!existing || r.url.length < existing.url.length) {
          byHost.set(host, r);
        }
      } catch {
        // unparseable URL — skip
      }
    }

    res.json({ results: Array.from(byHost.values()) });
  } catch (err) {
    console.error('Site search error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(req.params.id);
  if (!site) return res.status(404).json({ error: 'Site not found' });
  res.json(site);
});

router.post('/', (req, res) => {
  const { name, url, type, scrape_interval, portal_url } = req.body;
  if (!name || !url || !type) {
    return res.status(400).json({ error: 'name, url, and type are required' });
  }
  if (!['direct', 'portal'].includes(type)) {
    return res.status(400).json({ error: 'type must be direct or portal' });
  }

  const result = db.prepare(
    'INSERT INTO sites (name, url, type, scrape_interval, portal_url) VALUES (?, ?, ?, ?, ?)'
  ).run(name, url, type, scrape_interval || 3600, portal_url || null);

  const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(site);
});

router.patch('/:id', (req, res) => {
  const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(req.params.id);
  if (!site) return res.status(404).json({ error: 'Site not found' });

  const allowed = ['name', 'url', 'type', 'scrape_interval', 'structure_profile', 'portal_url'];
  const updates = [];
  const values = [];

  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  updates.push("updated_at = datetime('now')");
  values.push(req.params.id);

  db.prepare(`UPDATE sites SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  const updated = db.prepare('SELECT * FROM sites WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.post('/:id/discover', async (req, res) => {
  const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(req.params.id);
  if (!site) return res.status(404).json({ error: 'Site not found' });
  if (site.type === 'portal') {
    return res.status(400).json({ error: 'Portal sites are not supported yet.' });
  }

  try {
    const { discoverSite } = require('../agents/discover');
    const { rawScrapes, programs, parseSkipped } = await discoverSite(site);

    // Store raw scrapes
    const insertRaw = db.prepare('INSERT INTO raw_scrapes (site_id, url, content) VALUES (?, ?, ?)');
    for (const s of rawScrapes) {
      insertRaw.run(site.id, s.url, s.content || null);
    }

    // Bulk insert programs
    const insert = db.prepare(`
      INSERT INTO programs (site_id, name, type, age_group, start_date, end_date, day_of_week, start_time, end_time, location, cost, registration_status, spots_available, source_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const bulkInsert = db.transaction((progs) => {
      db.prepare('DELETE FROM programs WHERE site_id = ?').run(site.id);
      for (const p of progs) {
        insert.run(
          site.id, p.name, p.type || null, p.ageGroup || null,
          p.dates?.start || null, p.dates?.end || null,
          p.times?.day || null, p.times?.start || null, p.times?.end || null,
          p.location || null,
          p.cost != null ? String(p.cost) : null,
          p.registrationStatus || null,
          p.spotsAvailable ?? null,
          p.sourceUrl || null
        );
      }
    });

    bulkInsert(programs);

    res.json({ programs: programs.length, raw_scrapes: rawScrapes.length, parse_skipped: parseSkipped || false });
  } catch (err) {
    console.error('Discovery error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM sites WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Site not found' });
  res.json({ ok: true });
});

// Raw scrapes
router.post('/:id/raw-scrapes', (req, res) => {
  const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(req.params.id);
  if (!site) return res.status(404).json({ error: 'Site not found' });

  const { url, content } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });

  const result = db.prepare(
    'INSERT INTO raw_scrapes (site_id, url, content) VALUES (?, ?, ?)'
  ).run(req.params.id, url, content || null);

  const record = db.prepare('SELECT * FROM raw_scrapes WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(record);
});

router.get('/:id/raw-scrapes', (req, res) => {
  const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(req.params.id);
  if (!site) return res.status(404).json({ error: 'Site not found' });

  const scrapes = db.prepare(
    'SELECT id, site_id, url, scraped_at FROM raw_scrapes WHERE site_id = ? ORDER BY scraped_at DESC'
  ).all(req.params.id);
  res.json(scrapes);
});

// Bulk-insert programs for a site
router.post('/:id/programs', (req, res) => {
  const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(req.params.id);
  if (!site) return res.status(404).json({ error: 'Site not found' });

  const { programs } = req.body;
  if (!Array.isArray(programs)) {
    return res.status(400).json({ error: 'programs array is required' });
  }

  const insert = db.prepare(`
    INSERT INTO programs (site_id, name, type, age_group, start_date, end_date, day_of_week, start_time, end_time, location, cost, registration_status, spots_available, source_url, raw_content)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const bulkInsert = db.transaction((programs) => {
    db.prepare('DELETE FROM programs WHERE site_id = ?').run(req.params.id);
    for (const p of programs) {
      insert.run(
        req.params.id, p.name, p.type || null, p.age_group || null,
        p.start_date || null, p.end_date || null, p.day_of_week || null,
        p.start_time || null, p.end_time || null, p.location || null,
        p.cost || null, p.registration_status || null, p.spots_available || null,
        p.source_url || null, p.raw_content || null
      );
    }
  });

  bulkInsert(programs);
  res.status(201).json({ inserted: programs.length });
});

module.exports = router;
