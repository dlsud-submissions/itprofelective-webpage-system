const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Unlike requireAuth, this never rejects the request -- it just attaches
// req.user when a valid session is present, so a route can serve different
// data to anonymous/logged-in callers without requiring a login.
async function attachUserIfPresent(req, res, next) {
  const token = req.cookies?.token || (req.headers.authorization || '').replace(/^Bearer /, '');

  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);

    if (user) {
      req.user = user;
    }
  } catch {
    // Invalid/expired token -- treat the request as anonymous.
  }

  next();
}

module.exports = attachUserIfPresent;
