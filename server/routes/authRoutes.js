const express = require('express');
const authController = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// Pure JSON API -- the client/ React app (see ../client) is the UI for
// these routes; there is no server-rendered register/login page.
router.post('/register', authController.register);
router.post('/login', authController.login);

router.post('/logout', authController.logout);

// Demonstrates requireAuth protecting a route; Epic B's admin routes reuse this same middleware.
router.get('/me', requireAuth, (req, res) => {
  res.status(200).json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isBanned: req.user.isBanned,
    },
  });
});

module.exports = router;
