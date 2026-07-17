const express = require('express');
const serviceController = require('../controllers/serviceController');
const requireAuth = require('../middleware/requireAuth');
const requireStaffOrAdmin = require('../middleware/requireStaffOrAdmin');
const attachUserIfPresent = require('../middleware/attachUserIfPresent');

const router = express.Router();

router.get('/services', attachUserIfPresent, serviceController.listServices);
router.post('/services', requireAuth, requireStaffOrAdmin, serviceController.createService);
router.patch('/services/:id', requireAuth, requireStaffOrAdmin, serviceController.updateService);

module.exports = router;
