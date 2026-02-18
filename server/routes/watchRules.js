const { Router } = require('express');
const db = require('../db');

const router = Router();

router.get('/', (req, res) => {
  const rules = db.prepare('SELECT * FROM watch_rules ORDER BY created_at DESC').all();
  res.json(rules);
});

router.post('/', (req, res) => {
  const { site_id, program_id, activity_type, age_group, auto_register } = req.body;

  const result = db.prepare(
    'INSERT INTO watch_rules (site_id, program_id, activity_type, age_group, auto_register) VALUES (?, ?, ?, ?, ?)'
  ).run(site_id || null, program_id || null, activity_type || null, age_group || null, auto_register ? 1 : 0);

  const rule = db.prepare('SELECT * FROM watch_rules WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(rule);
});

router.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM watch_rules WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Watch rule not found' });

  const fields = ['site_id', 'program_id', 'activity_type', 'age_group', 'auto_register', 'active'];
  const updates = [];
  const params = [];

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`);
      params.push(field === 'auto_register' || field === 'active' ? (req.body[field] ? 1 : 0) : req.body[field]);
    }
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updates.push("updated_at = datetime('now')");
  params.push(req.params.id);

  db.prepare(`UPDATE watch_rules SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  const rule = db.prepare('SELECT * FROM watch_rules WHERE id = ?').get(req.params.id);
  res.json(rule);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM watch_rules WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Watch rule not found' });
  res.json({ ok: true });
});

module.exports = router;
