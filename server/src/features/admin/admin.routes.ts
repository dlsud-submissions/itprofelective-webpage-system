import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { requireAuth } from '../../shared/middleware/requireAuth.js';
import { requireAdmin } from '../../shared/middleware/requireAdmin.js';

export const adminRoutes = Router();

adminRoutes.use(requireAuth, requireAdmin);

adminRoutes.get('/users', adminController.listUsers);
adminRoutes.patch('/users/:id/ban', adminController.setBanStatus);
adminRoutes.patch('/users/:id/role', adminController.setRole);
