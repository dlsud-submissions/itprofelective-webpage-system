const express = require('express');
const adminController = require('../controllers/adminController');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get('/users', adminController.listUsers);
router.patch('/users/:id/ban', adminController.setBanStatus);
router.patch('/users/:id/role', adminController.setRole);

module.exports = router;
