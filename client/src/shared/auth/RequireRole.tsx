import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from './useAuth';
import { dashboardPathForRole } from './dashboardPath';
import type { AuthUser } from './AuthContext';

interface RequireRoleProps {
  role: AuthUser['role'];
  children: ReactNode;
}

export function RequireRole({ role, children }: RequireRoleProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }

  return <>{children}</>;
}
