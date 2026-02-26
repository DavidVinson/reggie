const { Router } = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../db');

const router = Router();

const SESSION_DAYS = 7;

function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400 * 1000).toISOString();
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expiresAt);
  return token;
}

router.post('/login', async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });

  const user = db.prepare('SELECT * FROM users LIMIT 1').get();
  if (!user) return res.status(401).json({ error: 'Account not configured' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid password' });

  const token = createSession(user.id);
  res.json({ token });
});

router.post('/logout', (req, res) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(header.slice(7));
  }
  res.json({ ok: true });
});

module.exports = { router, createSession };
