import express from 'express';
import cookieParser from 'cookie-parser';
import { authRoutes } from './features/auth/auth.routes.js';
import { adminRoutes } from './features/admin/admin.routes.js';
import { servicesRoutes } from './features/services/services.routes.js';
import { productsRoutes } from './features/products/products.routes.js';
import { purchasesRoutes } from './features/purchases/purchases.routes.js';

export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// The UI lives in ./client (a separate Vite dev server that proxies
// these routes back here -- see client/vite.config.ts). This process is
// the JSON API only.
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/', servicesRoutes);
app.use('/', productsRoutes);
app.use('/', purchasesRoutes);
