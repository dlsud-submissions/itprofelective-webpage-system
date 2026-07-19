import type { AuthUser } from './AuthContext';

export function dashboardPathForRole(role: AuthUser['role']): string {
  switch (role) {
    case 'admin':
      return '/dashboard/admin';
    case 'staff':
      return '/dashboard/staff';
    default:
      return '/dashboard/customer';
  }
}
