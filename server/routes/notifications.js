const { Router } = require('express');
const db = require('../db');

const router = Router();

router.get('/', (req, res) => {
  const notifications = db.prepare('SELECT * FROM notifications ORDER BY created_at DESC').all();
  res.json(notifications);
});

router.patch('/:id/read', (req, res) => {
  const result = db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Notification not found' });
  const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id);
  res.json(notification);
});

module.exports = router;
