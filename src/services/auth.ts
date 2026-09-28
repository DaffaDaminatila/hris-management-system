import { mockDb } from './mockDb';
import { generateAccessToken, generateRefreshToken, createTokenPayload, verifyToken } from '../utils/jwt';
import type { User, LoginCredentials, RegisterData, AuthResponse, RefreshResponse, MeResponse } from '../types/index';

const REFRESH_TOKEN_KEY = 'hris_refresh_token';

function setRefreshTokenCookie(token: string): void {
  // In production, this would be an httpOnly cookie set by the server
  // For demo, we store in localStorage
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function clearRefreshToken(): void {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const user = await mockDb.verifyCredentials(credentials.email, credentials.password);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const payload = createTokenPayload(user);
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    setRefreshTokenCookie(refreshToken);

    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword as User,
      accessToken,
      refreshToken,
    };
  },

  async register(data: RegisterData): Promise<{ user: User }> {
    // Check if user already exists
    const existing = await mockDb.findUserByEmail(data.email);
    if (existing) {
      throw new Error('Email already registered');
    }

    const newUser = await mockDb.createUser({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      role: data.role,
      departmentId: data.departmentId || null,
    });

    const { passwordHash, ...userWithoutPassword } = newUser;
    return { user: userWithoutPassword as User };
  },

  async refresh(): Promise<RefreshResponse> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    const payload = verifyToken(refreshToken);
    if (!payload) {
      clearRefreshToken();
      throw new Error('Invalid refresh token');
    }

    // Get fresh user data
    const user = await mockDb.findUserById(payload.sub);
    if (!user) {
      clearRefreshToken();
      throw new Error('User not found');
    }

    const newPayload = createTokenPayload(user);
    const accessToken = generateAccessToken(newPayload);

    return { accessToken };
  },

  async me(accessToken: string): Promise<MeResponse> {
    const payload = verifyToken(accessToken);
    if (!payload) {
      throw new Error('Invalid access token');
    }

    const user = await mockDb.findUserById(payload.sub);
    if (!user) {
      throw new Error('User not found');
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword as User };
  },

  logout(): void {
    clearRefreshToken();
  },

  getStoredRefreshToken(): string | null {
    return getRefreshToken();
  },
};