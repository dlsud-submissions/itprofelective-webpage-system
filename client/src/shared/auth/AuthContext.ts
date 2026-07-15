import { createContext } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'staff' | 'admin';
  isBanned: boolean;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
