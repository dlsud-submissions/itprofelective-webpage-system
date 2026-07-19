import { Router } from 'express';
import * as servicesController from './services.controller.js';
import { requireAuth } from '../../shared/middleware/requireAuth.js';
import { requireStaffOrAdmin } from '../../shared/middleware/requireStaffOrAdmin.js';
import { attachUserIfPresent } from '../../shared/middleware/attachUserIfPresent.js';

export const servicesRoutes = Router();

servicesRoutes.get(
  '/services',
  attachUserIfPresent,
  servicesController.listServices
);
servicesRoutes.post(
  '/services',
  requireAuth,
  requireStaffOrAdmin,
  servicesController.createService
);
servicesRoutes.patch(
  '/services/:id',
  requireAuth,
  requireStaffOrAdmin,
  servicesController.updateService
);
