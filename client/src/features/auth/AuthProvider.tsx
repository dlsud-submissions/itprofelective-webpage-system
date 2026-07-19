import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AuthContext, type AuthUser } from './AuthContext';
import { me as fetchMe, logout as logoutRequest } from './api/auth.api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const result = await fetchMe();
    setUser(result.data?.user ?? null);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    void refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  const signOut = useCallback(async () => {
    await logoutRequest();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
