import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token =
    req.cookies?.token ||
    (req.headers.authorization || '').replace(/^Bearer /, '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
    };
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
