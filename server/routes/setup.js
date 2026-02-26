const { Router } = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { createSession } = require('./auth');

const router = Router();

function needsSetup() {
  return !db.prepare('SELECT id FROM users LIMIT 1').get();
}

router.get('/status', (req, res) => {
  res.json({ needsSetup: needsSetup() });
});

router.post('/', async (req, res) => {
  if (!needsSetup()) {
    return res.status(403).json({ error: 'Account already configured' });
  }

  const { password, phoneNumber } = req.body;
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const hash = await bcrypt.hash(password, 12);
  const { lastInsertRowid } = db.prepare(
    'INSERT INTO users (password_hash, phone_number) VALUES (?, ?)'
  ).run(hash, phoneNumber?.trim() || null);

  const token = createSession(lastInsertRowid);
  res.json({ token });
});

module.exports = router;
