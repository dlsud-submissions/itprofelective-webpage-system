const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function requireAuth(req, res, next) {
  const token = req.cookies?.token || (req.headers.authorization || '').replace(/^Bearer /, '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);

    if (!user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Authentication required.' });
  }
}

module.exports = requireAuth;
