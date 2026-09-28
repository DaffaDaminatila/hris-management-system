import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { mockDb } from './mockDb';
import { verifyToken, generateAccessToken, generateRefreshToken, createTokenPayload } from '../utils/jwt';

vi.mock('../utils/jwt', () => ({
  verifyToken: vi.fn(),
  generateAccessToken: vi.fn(),
  generateRefreshToken: vi.fn(),
  createTokenPayload: vi.fn(),
}));

vi.mock('./mockDb', () => ({
  mockDb: {
    verifyCredentials: vi.fn(),
    findUserByEmail: vi.fn(),
    createUser: vi.fn(),
    findUserById: vi.fn(),
    getAllUsers: vi.fn(),
  },
}))

const mockUser = {
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

describe('authApi', () => {
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

  async function getAuthApi() {
    const { authApi } = await import('./auth');
    return authApi;
  }

  describe('login', () => {
    it('should return user and tokens on successful login', async () => {
      const authApi = await getAuthApi();

      (mockDb.verifyCredentials as Mock).mockResolvedValue(mockUser);
      (createTokenPayload as Mock).mockReturnValue(mockPayload);
      (generateAccessToken as Mock).mockReturnValue('access-token');
      (generateRefreshToken as Mock).mockReturnValue('refresh-token');

      const result = await authApi.login({ email: 'hr@company.com', password: 'password' });

      expect(mockDb.verifyCredentials).toHaveBeenCalledWith('hr@company.com', 'password');
      expect(createTokenPayload).toHaveBeenCalledWith(mockUser);
      expect(generateAccessToken).toHaveBeenCalledWith(mockPayload);
      expect(generateRefreshToken).toHaveBeenCalledWith(mockPayload);
      expect(globalThis.localStorage.setItem).toHaveBeenCalledWith('hris_refresh_token', 'refresh-token');
      expect(result.user.email).toBe('hr@company.com');
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should throw error when credentials are invalid', async () => {
      const authApi = await getAuthApi();

      (mockDb.verifyCredentials as Mock).mockResolvedValue(null);

      await expect(authApi.login({ email: 'wrong@company.com', password: 'wrong' }))
        .rejects.toThrow('Invalid email or password');
    });
  });

  describe('register', () => {
    it('should create new user and return user without password', async () => {
      const authApi = await getAuthApi();
      const newUser = { ...mockUser, id: 'new-id', email: 'new@company.com' };

      (mockDb.findUserByEmail as Mock).mockResolvedValue(null);
      (mockDb.createUser as Mock).mockResolvedValue(newUser);

      const result = await authApi.register({
        email: 'new@company.com',
        password: 'password',
        fullName: 'New User',
        role: 'STAFF',
        departmentId: 'dept-1',
      });

      expect(mockDb.findUserByEmail).toHaveBeenCalledWith('new@company.com');
      expect(mockDb.createUser).toHaveBeenCalledWith({
        email: 'new@company.com',
        password: 'password',
        fullName: 'New User',
        role: 'STAFF',
        departmentId: 'dept-1',
      });
      expect(result.user.email).toBe('new@company.com');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should throw error when email already registered', async () => {
      const authApi = await getAuthApi();

      (mockDb.findUserByEmail as Mock).mockResolvedValue(mockUser);

      await expect(authApi.register({
        email: 'hr@company.com',
        password: 'password',
        fullName: 'New User',
        role: 'STAFF',
      })).rejects.toThrow('Email already registered');
    });
  });

  describe('refresh', () => {
    it('should return new access token when refresh token is valid', async () => {
      const authApi = await getAuthApi();
      const refreshedUser = { ...mockUser, id: '1' };

      (globalThis.localStorage.getItem as Mock).mockReturnValue('refresh-token');
      (verifyToken as Mock).mockReturnValue(mockPayload);
      (mockDb.findUserById as Mock).mockResolvedValue(refreshedUser);
      (createTokenPayload as Mock).mockReturnValue(mockPayload);
      (generateAccessToken as Mock).mockReturnValue('new-access-token');

      const result = await authApi.refresh();

      expect(globalThis.localStorage.getItem).toHaveBeenCalledWith('hris_refresh_token');
      expect(verifyToken).toHaveBeenCalledWith('refresh-token');
      expect(mockDb.findUserById).toHaveBeenCalledWith('1');
      expect(createTokenPayload).toHaveBeenCalledWith(refreshedUser);
      expect(generateAccessToken).toHaveBeenCalledWith(mockPayload);
      expect(result.accessToken).toBe('new-access-token');
    });

    it('should throw error when no refresh token stored', async () => {
      const authApi = await getAuthApi();

      (globalThis.localStorage.getItem as Mock).mockReturnValue(null);

      await expect(authApi.refresh()).rejects.toThrow('No refresh token');
    });

    it('should throw error and clear token when refresh token is invalid', async () => {
      const authApi = await getAuthApi();

      (globalThis.localStorage.getItem as Mock).mockReturnValue('invalid-refresh-token');
      (verifyToken as Mock).mockReturnValue(null);

      await expect(authApi.refresh()).rejects.toThrow('Invalid refresh token');
      expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith('hris_refresh_token');
    });

    it('should throw error and clear token when user not found', async () => {
      const authApi = await getAuthApi();

      (globalThis.localStorage.getItem as Mock).mockReturnValue('refresh-token');
      (verifyToken as Mock).mockReturnValue(mockPayload);
      (mockDb.findUserById as Mock).mockResolvedValue(null);

      await expect(authApi.refresh()).rejects.toThrow('User not found');
      expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith('hris_refresh_token');
    });
  });

  describe('me', () => {
    it('should return user when access token is valid', async () => {
      const authApi = await getAuthApi();

      (verifyToken as Mock).mockReturnValue(mockPayload);
      (mockDb.findUserById as Mock).mockResolvedValue(mockUser);

      const result = await authApi.me('valid-access-token');

      expect(verifyToken).toHaveBeenCalledWith('valid-access-token');
      expect(mockDb.findUserById).toHaveBeenCalledWith('1');
      expect(result.user.email).toBe('hr@company.com');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should throw error when access token is invalid', async () => {
      const authApi = await getAuthApi();

      (verifyToken as Mock).mockReturnValue(null);

      await expect(authApi.me('invalid-token')).rejects.toThrow('Invalid access token');
    });

    it('should throw error when user not found', async () => {
      const authApi = await getAuthApi();

      (verifyToken as Mock).mockReturnValue(mockPayload);
      (mockDb.findUserById as Mock).mockResolvedValue(null);

      await expect(authApi.me('valid-token')).rejects.toThrow('User not found');
    });
  });

  describe('logout', () => {
    it('should clear refresh token from storage', async () => {
      const authApi = await getAuthApi();

      authApi.logout();

      expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith('hris_refresh_token');
    });
  });

  describe('getStoredRefreshToken', () => {
    it('should return stored refresh token', async () => {
      const authApi = await getAuthApi();

      (globalThis.localStorage.getItem as Mock).mockReturnValue('stored-refresh-token');

      const result = authApi.getStoredRefreshToken();

      expect(globalThis.localStorage.getItem).toHaveBeenCalledWith('hris_refresh_token');
      expect(result).toBe('stored-refresh-token');
    });

    it('should return null when no token stored', async () => {
      const authApi = await getAuthApi();

      (globalThis.localStorage.getItem as Mock).mockReturnValue(null);

      const result = authApi.getStoredRefreshToken();

      expect(result).toBeNull();
    });
  });
});