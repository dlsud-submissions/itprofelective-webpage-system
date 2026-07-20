import { Router } from 'express';
import * as purchasesController from './purchases.controller.js';
import { requireAuth } from '../../shared/middleware/requireAuth.js';

export const purchasesRoutes = Router();

purchasesRoutes.get(
  '/purchases',
  requireAuth,
  purchasesController.listMyPurchases
);
purchasesRoutes.post(
  '/purchases',
  requireAuth,
  purchasesController.createPurchase
);
