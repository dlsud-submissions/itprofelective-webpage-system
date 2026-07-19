import { Router } from 'express';
import * as authController from './auth.controller.js';
import { requireAuth } from '../../shared/middleware/requireAuth.js';

export const authRoutes = Router();

// Pure JSON API -- the client/ React app (see ../client) is the UI for
// these routes; there is no server-rendered register/login page.
authRoutes.post('/register', authController.register);
authRoutes.post('/login', authController.login);

authRoutes.post('/logout', authController.logout);

// Demonstrates requireAuth protecting a route; Epic B's admin routes reuse this same middleware.
authRoutes.get('/me', requireAuth, (req, res) => {
  const user = req.user!;
  res.status(200).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isBanned: user.isBanned,
    },
  });
});
