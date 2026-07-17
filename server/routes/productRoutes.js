const express = require('express');
const productController = require('../controllers/productController');
const requireAuth = require('../middleware/requireAuth');
const requireStaffOrAdmin = require('../middleware/requireStaffOrAdmin');
const attachUserIfPresent = require('../middleware/attachUserIfPresent');

const router = express.Router();

router.get('/products', attachUserIfPresent, productController.listProducts);
router.post('/products', requireAuth, requireStaffOrAdmin, productController.createProduct);
router.patch('/products/:id', requireAuth, requireStaffOrAdmin, productController.updateProduct);

module.exports = router;
