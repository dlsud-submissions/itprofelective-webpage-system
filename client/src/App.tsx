import { BrowserRouter, Route, Routes } from 'react-router';
import { AuthProvider } from './shared/auth/AuthProvider';
import { RequireRole } from './shared/auth/RequireRole';
import { LandingPage } from './pages/LandingPage/LandingPage';
import { LoginPage } from './pages/LoginPage/LoginPage';
import { SignupPage } from './pages/SignupPage/SignupPage';
import { ServicesPage } from './pages/ServicesPage/ServicesPage';
import { ProductsPage } from './pages/ProductsPage/ProductsPage';
import { CustomerDashboardPage } from './pages/CustomerDashboardPage/CustomerDashboardPage';
import { StaffDashboardPage } from './pages/StaffDashboardPage/StaffDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage/AdminDashboardPage';

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
              (see server/routes/adminRoutes.js) can never collide with the
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
