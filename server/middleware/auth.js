const db = require('../db');

function auth(req, res, next) {
  if (process.env.NODE_ENV !== 'production') return next();
  if (!req.path.startsWith('/api/')) return next();
  if (req.path.startsWith('/api/setup')) return next();
  if (req.path === '/api/auth/login') return next();

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = header.slice(7);
  const session = db.prepare(
    "SELECT * FROM sessions WHERE token = ? AND expires_at > datetime('now')"
  ).get(token);

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  next();
}

module.exports = auth;
