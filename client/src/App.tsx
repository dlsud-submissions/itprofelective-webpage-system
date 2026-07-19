import { BrowserRouter, Route, Routes } from 'react-router';
import { AuthProvider } from './features/auth/AuthProvider';
import { RequireRole } from './features/auth/RequireRole';
import { LandingPage } from './features/landing/pages/LandingPage/LandingPage';
import { LoginPage } from './features/auth/pages/LoginPage/LoginPage';
import { SignupPage } from './features/auth/pages/SignupPage/SignupPage';
import { ServicesPage } from './features/catalog/pages/ServicesPage/ServicesPage';
import { ProductsPage } from './features/catalog/pages/ProductsPage/ProductsPage';
import { CustomerDashboardPage } from './features/dashboard/pages/CustomerDashboardPage/CustomerDashboardPage';
import { StaffDashboardPage } from './features/dashboard/pages/StaffDashboardPage/StaffDashboardPage';
import { AdminDashboardPage } from './features/dashboard/pages/AdminDashboardPage/AdminDashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          {/* Nested under /catalog, not /services or /products directly --
              those exact paths are claimed by vite.config.ts's dev-server
              proxy to the Express API, so a full page load/refresh at
              /services would otherwise hit the JSON API instead of this app. */}
          <Route path="/catalog/services" element={<ServicesPage />} />
          <Route path="/catalog/products" element={<ProductsPage />} />
          {/* Nested under /dashboard so a future /admin API proxy entry
              (see server/src/features/admin/admin.routes.ts) can never collide with the
              admin dashboard page the way /services once did with the
              catalog pages. */}
          <Route
            path="/dashboard/customer"
            element={
              <RequireRole role="user">
                <CustomerDashboardPage />
              </RequireRole>
            }
          />
          <Route
            path="/dashboard/staff"
            element={
              <RequireRole role="staff">
                <StaffDashboardPage />
              </RequireRole>
            }
          />
          <Route
            path="/dashboard/admin"
            element={
              <RequireRole role="admin">
                <AdminDashboardPage />
              </RequireRole>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
