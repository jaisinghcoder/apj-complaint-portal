const jwt = require('jsonwebtoken');

function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: { message: 'Missing auth token' } });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: payload.sub,
      role: payload.role,
    };
    return next();
  } catch (e) {
    return res.status(401).json({ error: { message: 'Invalid or expired token' } });
  }
}

function requireRole(role) {
  return function roleMiddleware(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }
    return next();
  };
}

module.exports = { authRequired, requireRole };
