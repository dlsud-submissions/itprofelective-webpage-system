import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  User,
  USER_ROLES,
  type UserDocument,
} from '../../shared/models/user.model.js';

function toPublicUser(user: UserDocument) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isBanned: user.isBanned,
    createdAt: user.createdAt,
  };
}

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function listUsers(_req: Request, res: Response) {
  const users = await User.find().sort({ createdAt: -1, email: 1 });

  return res.status(200).json({ users: users.map(toPublicUser) });
}

export async function setBanStatus(req: Request, res: Response) {
  const { id } = req.params;
  const { isBanned } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }

  if (typeof isBanned !== 'boolean') {
    return res.status(400).json({ error: 'isBanned must be true or false.' });
  }

  if (String(req.user!._id) === id && isBanned) {
    return res
      .status(400)
      .json({ error: 'Admins cannot ban their own account.' });
  }

  const user = await User.findByIdAndUpdate(
    id,
    { isBanned },
    { new: true, runValidators: true }
  );
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  return res.status(200).json({ user: toPublicUser(user) });
}

export async function setRole(req: Request, res: Response) {
  const { id } = req.params;
  const { role } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }

  if (!USER_ROLES.includes(role)) {
    return res
      .status(400)
      .json({ error: 'Role must be user, staff, or admin.' });
  }

  const user = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true, runValidators: true }
  );
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  return res.status(200).json({ user: toPublicUser(user) });
}
