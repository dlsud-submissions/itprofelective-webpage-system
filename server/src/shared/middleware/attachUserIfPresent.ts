import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

// Unlike requireAuth, this never rejects the request -- it just attaches
// req.user when a valid session is present, so a route can serve different
// data to anonymous/logged-in callers without requiring a login.
export async function attachUserIfPresent(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const token =
    req.cookies?.token ||
    (req.headers.authorization || '').replace(/^Bearer /, '');

  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
    };
    const user = await User.findById(payload.id);

    if (user) {
      req.user = user;
    }
  } catch {
    // Invalid/expired token -- treat the request as anonymous.
  }

  next();
}
