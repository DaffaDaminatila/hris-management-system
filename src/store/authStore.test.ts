import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { decodeToken } from '../utils/jwt';

vi.mock('../utils/jwt', () => ({
  decodeToken: vi.fn(),
}));

import type { User } from '../types/index';

const mockUser: User = {
  id: '1',
  email: 'hr@company.com',
  passwordHash: '$2a$10$dummy_hash_hr',
  fullName: 'HR Admin',
  role: 'HR' as const,
  departmentId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockPayload = {
  sub: '1',
  email: 'hr@company.com',
  role: 'HR' as const,
  deptId: null,
};

describe('authStore', () => {
  let originalLocalStorage: Storage;

  beforeEach(() => {
    vi.clearAllMocks();
    originalLocalStorage = globalThis.localStorage;
    globalThis.localStorage = {
      ...originalLocalStorage,
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    } as unknown as Storage;
    vi.resetModules();
  });

  afterEach(() => {
    globalThis.localStorage = originalLocalStorage;
  });

  async function getAuthStore() {
    const { useAuthStore } = await import('./authStore');
    return useAuthStore;
  }

  describe('initial state', () => {
    it('should have correct initial values', async () => {
      const useAuthStore = await getAuthStore();
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('setAuth', () => {
    it('should set user, accessToken, isAuthenticated, and clear error', async () => {
      const useAuthStore = await getAuthStore();

      useAuthStore.getState().setAuth(mockUser, 'access-token');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('access-token');
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
    });
  });

  describe('setUser', () => {
    it('should update user only', async () => {
      const useAuthStore = await getAuthStore();
      useAuthStore.getState().setAuth(mockUser, 'token');

      const newUser = { ...mockUser, fullName: 'Updated Name' };
      useAuthStore.getState().setUser(newUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(newUser);
      expect(state.accessToken).toBe('token');
    });
  });

  describe('setAccessToken', () => {
    it('should update accessToken only', async () => {
      const useAuthStore = await getAuthStore();
      useAuthStore.getState().setAuth(mockUser, 'old-token');

      useAuthStore.getState().setAccessToken('new-token');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('new-token');
      expect(state.user).toEqual(mockUser);
    });
  });

  describe('setLoading', () => {
    it('should set isLoading', async () => {
      const useAuthStore = await getAuthStore();

      useAuthStore.getState().setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);

      useAuthStore.getState().setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error message', async () => {
      const useAuthStore = await getAuthStore();

      useAuthStore.getState().setError('Something went wrong');
      expect(useAuthStore.getState().error).toBe('Something went wrong');

      useAuthStore.getState().setError(null);
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear all auth state', async () => {
      const useAuthStore = await getAuthStore();
      useAuthStore.getState().setAuth(mockUser, 'access-token');
      useAuthStore.getState().setError('Some error');

      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('restoreFromToken', () => {
    it('should return false and not update state when token is invalid', async () => {
      const useAuthStore = await getAuthStore();
      (decodeToken as Mock).mockReturnValue(null);

      const result = useAuthStore.getState().restoreFromToken('invalid-token');

      expect(result).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().accessToken).toBeNull();
    });

    it('should return true and set accessToken and isAuthenticated when token is valid', async () => {
      const useAuthStore = await getAuthStore();
      (decodeToken as Mock).mockReturnValue(mockPayload);

      const result = useAuthStore.getState().restoreFromToken('valid-token');

      expect(decodeToken).toHaveBeenCalledWith('valid-token');
      expect(result).toBe(true);
      expect(useAuthStore.getState().accessToken).toBe('valid-token');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });
  });

  describe('selectors', () => {
    it('selectUser should return user', async () => {
      const { selectUser } = await import('./authStore');
      const useAuthStore = await getAuthStore();
      useAuthStore.getState().setAuth(mockUser, 'token');

      expect(selectUser(useAuthStore.getState())).toEqual(mockUser);
    });

    it('selectAccessToken should return accessToken', async () => {
      const { selectAccessToken } = await import('./authStore');
      const useAuthStore = await getAuthStore();
      useAuthStore.getState().setAuth(mockUser, 'my-token');

      expect(selectAccessToken(useAuthStore.getState())).toBe('my-token');
    });

    it('selectIsAuthenticated should return isAuthenticated', async () => {
      const { selectIsAuthenticated } = await import('./authStore');
      const useAuthStore = await getAuthStore();

      expect(selectIsAuthenticated(useAuthStore.getState())).toBe(false);

      useAuthStore.getState().setAuth(mockUser, 'token');
      expect(selectIsAuthenticated(useAuthStore.getState())).toBe(true);
    });

    it('selectIsLoading should return isLoading', async () => {
      const { selectIsLoading } = await import('./authStore');
      const useAuthStore = await getAuthStore();

      expect(selectIsLoading(useAuthStore.getState())).toBe(false);

      useAuthStore.getState().setLoading(true);
      expect(selectIsLoading(useAuthStore.getState())).toBe(true);
    });

    it('selectError should return error', async () => {
      const { selectError } = await import('./authStore');
      const useAuthStore = await getAuthStore();

      expect(selectError(useAuthStore.getState())).toBeNull();

      useAuthStore.getState().setError('Error message');
      expect(selectError(useAuthStore.getState())).toBe('Error message');
    });

    it('selectUserRole should return user role', async () => {
      const { selectUserRole } = await import('./authStore');
      const useAuthStore = await getAuthStore();

      expect(selectUserRole(useAuthStore.getState())).toBeNull();

      useAuthStore.getState().setAuth(mockUser, 'token');
      expect(selectUserRole(useAuthStore.getState())).toBe('HR');
    });

    it('selectUserRole should return null when user has no role', async () => {
      const { selectUserRole } = await import('./authStore');
      const useAuthStore = await getAuthStore();
      const userWithoutRole = { ...mockUser, role: undefined as any };

      useAuthStore.getState().setAuth(userWithoutRole, 'token');
      expect(selectUserRole(useAuthStore.getState())).toBeNull();
    });
  });

  describe('persistence', () => {
    it('should persist user, accessToken, and isAuthenticated', async () => {
      const useAuthStore = await getAuthStore();
      useAuthStore.getState().setAuth(mockUser, 'persisted-token');

      // The persist middleware will call setItem
      expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
        'hris-auth-storage',
        expect.stringContaining('"user"')
      );
      expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
        'hris-auth-storage',
        expect.stringContaining('"accessToken"')
      );
      expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
        'hris-auth-storage',
        expect.stringContaining('"isAuthenticated":true')
      );
    });

    it('should not persist isLoading and error', async () => {
      const useAuthStore = await getAuthStore();
      useAuthStore.getState().setLoading(true);
      useAuthStore.getState().setError('Some error');

      const setItemCalls = (globalThis.localStorage.setItem as Mock).mock.calls;
      const lastCall = setItemCalls[setItemCalls.length - 1];
      const storedData = JSON.parse(lastCall[1]);

      expect(storedData.state).not.toHaveProperty('isLoading');
      expect(storedData.state).not.toHaveProperty('error');
    });
  });
});