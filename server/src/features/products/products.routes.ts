import { Router } from 'express';
import * as productsController from './products.controller.js';
import { requireAuth } from '../../shared/middleware/requireAuth.js';
import { requireStaffOrAdmin } from '../../shared/middleware/requireStaffOrAdmin.js';
import { attachUserIfPresent } from '../../shared/middleware/attachUserIfPresent.js';

export const productsRoutes = Router();

productsRoutes.get(
  '/products',
  attachUserIfPresent,
  productsController.listProducts
);
productsRoutes.post(
  '/products',
  requireAuth,
  requireStaffOrAdmin,
  productsController.createProduct
);
productsRoutes.patch(
  '/products/:id',
  requireAuth,
  requireStaffOrAdmin,
  productsController.updateProduct
);
