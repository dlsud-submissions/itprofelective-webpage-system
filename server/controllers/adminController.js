const mongoose = require('mongoose');
const User = require('../models/User');

const VALID_ROLES = ['user', 'staff', 'admin'];

function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isBanned: user.isBanned,
    createdAt: user.createdAt,
  };
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

exports.listUsers = async (req, res) => {
  const users = await User.find().sort({ createdAt: -1, email: 1 });

  return res.status(200).json({ users: users.map(toPublicUser) });
};

exports.setBanStatus = async (req, res) => {
  const { id } = req.params;
  const { isBanned } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }

  if (typeof isBanned !== 'boolean') {
    return res.status(400).json({ error: 'isBanned must be true or false.' });
  }

  if (String(req.user._id) === id && isBanned) {
    return res.status(400).json({ error: 'Admins cannot ban their own account.' });
  }

  const user = await User.findByIdAndUpdate(id, { isBanned }, { new: true, runValidators: true });
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  return res.status(200).json({ user: toPublicUser(user) });
};

exports.setRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Role must be user, staff, or admin.' });
  }

  const user = await User.findByIdAndUpdate(id, { role }, { new: true, runValidators: true });
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  return res.status(200).json({ user: toPublicUser(user) });
};
