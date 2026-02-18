const { Router } = require('express');
const db = require('../db');

const router = Router();

router.get('/', (req, res) => {
  const sites = db.prepare('SELECT * FROM sites ORDER BY created_at DESC').all();
  res.json(sites);
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
