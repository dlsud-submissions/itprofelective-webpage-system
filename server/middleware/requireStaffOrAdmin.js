function requireStaffOrAdmin(req, res, next) {
  if (!req.user || !['staff', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Staff or admin access required.' });
  }

  next();
}

module.exports = requireStaffOrAdmin;
