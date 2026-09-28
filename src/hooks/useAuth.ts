import { useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore, selectUser, selectAccessToken, selectIsAuthenticated, selectIsLoading, selectError } from '../store/authStore';
import { authApi } from '../services/auth';
import type { LoginCredentials, RegisterData, User } from '../types/index';

const AUTH_QUERY_KEY = ['auth', 'me'];

export function useAuth() {
  const user = useAuthStore(selectUser);
  const accessToken = useAuthStore(selectAccessToken);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoading = useAuthStore(selectIsLoading);
  const error = useAuthStore(selectError);
  const setAuth = useAuthStore(state => state.setAuth);
  const setUser = useAuthStore(state => state.setUser);
  const setAccessToken = useAuthStore(state => state.setAccessToken);
  const setLoading = useAuthStore(state => state.setLoading);
  const setError = useAuthStore(state => state.setError);
  const logout = useAuthStore(state => state.logout);
  const restoreFromToken = useAuthStore(state => state.restoreFromToken);

  const queryClient = useQueryClient();

  // Fetch current user
  const { data: meData } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      if (!accessToken) throw new Error('No access token');
      const response = await authApi.me(accessToken);
      return response.user;
    },
    enabled: !!accessToken && isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  // Update user when me query succeeds
  useEffect(() => {
    if (meData) {
      setUser(meData);
    }
  }, [meData, setUser]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      setLoading(true);
      setError(null);
      const response = await authApi.login(credentials);
      return response;
    },
    onSuccess: (response) => {
      setAuth(response.user, response.accessToken);
      queryClient.setQueryData(AUTH_QUERY_KEY, response.user);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      setLoading(true);
      setError(null);
      const response = await authApi.register(data);
      return response;
    },
    onSuccess: () => {
      // Don't auto-login after register, just show success
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  // Refresh token mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await authApi.refresh();
      return response.accessToken;
    },
    onSuccess: (newAccessToken) => {
      setAccessToken(newAccessToken);
    },
    onError: () => {
      logout();
    },
  });

  // Initialize auth from stored token
  useEffect(() => {
    let cancelled = false;
    const initAuth = async () => {
      // Already hydrated from persist (e.g. storageState in tests) — me query auto-runs
      if (isAuthenticated && accessToken) return;
      const storedToken = accessToken || authApi.getStoredRefreshToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        if (storedToken === accessToken && accessToken) {
          const restored = restoreFromToken(accessToken);
          if (!restored) {
            const newToken = await refreshMutation.mutateAsync();
            if (!cancelled) setAccessToken(newToken);
          }
          // me query auto-fetches via enabled flag once store updates — no manual refetch
        } else {
          const newToken = await refreshMutation.mutateAsync();
          if (!cancelled) setAccessToken(newToken);
        }
      } catch {
        if (!cancelled) logout();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    initAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    (credentials: LoginCredentials) => loginMutation.mutate(credentials),
    [loginMutation]
  );

  const register = useCallback(
    (data: RegisterData) => registerMutation.mutate(data),
    [registerMutation]
  );

  const handleLogout = useCallback(() => {
    authApi.logout();
    logout();
    queryClient.clear();
  }, [logout, queryClient]);

  const refresh = useCallback(() => refreshMutation.mutate(), [refreshMutation]);

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading: isLoading,
    error,
    login,
    register,
    logout: handleLogout,
    refresh,
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerMutation.isPending,
  };
}

export function useRequireAuth(): User | null {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated || !user) return null;

  return user;
}

export function useRequireRole(...allowedRoles: Array<'STAFF' | 'MANAGER' | 'HR'>): User | null {
  const user = useRequireAuth();

  if (!user) return null;
  if (!allowedRoles.includes(user.role)) return null;

  return user;
}