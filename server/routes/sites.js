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

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM sites WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Site not found' });
  res.json({ ok: true });
});

module.exports = router;
