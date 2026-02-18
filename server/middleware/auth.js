const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  if (process.env.NODE_ENV !== 'production') return next();
  if (req.path === '/api/auth/login') return next();

  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = auth;
