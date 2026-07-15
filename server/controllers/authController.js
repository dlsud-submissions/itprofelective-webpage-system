const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const SALT_ROUNDS = 10;

function issueToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
}

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  });
}

function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isBanned: user.isBanned,
  };
}

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const existing = await User.findOne({ email: email.trim().toLowerCase() });
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    name,
    email,
    passwordHash,
  });

  return res.status(201).json({ user: toPublicUser(user) });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  if (user.isBanned) {
    return res.status(403).json({ error: 'This account has been banned.' });
  }

  const token = issueToken(user);
  setAuthCookie(res, token);

  return res.status(200).json({ user: toPublicUser(user), token });
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({ message: 'Logged out.' });
};
