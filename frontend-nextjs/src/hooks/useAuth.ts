// useAuth.ts — Hook de gestion de session JWT (cookies)
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService, type AuthUser } from '@/services/auth.service';

interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Lire l'utilisateur depuis le cookie (pas le localStorage)
    if (authService.isAuthenticated()) {
      const stored = authService.getUser();
      setUser(stored);
    }
    setIsLoading(false);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    router.push('/login');
  }, [router]);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    logout,
  };
}
