import type { NextFunction, Request, Response } from 'express';

export function requireStaffOrAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user || !['staff', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Staff or admin access required.' });
  }

  next();
}
