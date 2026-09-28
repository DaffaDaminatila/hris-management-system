import { describe, it, expect } from 'vitest';
import { generateAccessToken, generateRefreshToken, verifyToken, decodeToken, isTokenExpired, createTokenPayload } from './jwt';
import type { TokenPayload, Role } from '../types/auth';

const mockPayload: TokenPayload = {
  sub: 'user-123',
  email: 'test@company.com',
  role: 'STAFF',
  deptId: 'dept-1',
};

const mockUser = {
  id: 'user-123',
  email: 'test@company.com',
  role: 'STAFF' as Role,
  departmentId: 'dept-1',
};

describe('jwt utilities', () => {
  describe('generateAccessToken', () => {
    it('should generate a valid JWT with 3 parts', () => {
      const token = generateAccessToken(mockPayload);
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
    });

    it('should produce a token that verifyToken accepts', () => {
      const token = generateAccessToken(mockPayload);
      const verified = verifyToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.sub).toBe('user-123');
      expect(verified?.email).toBe('test@company.com');
      expect(verified?.role).toBe('STAFF');
    });

    it('should include iat and exp claims', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = decodeToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.iat).toBeDefined();
      expect(decoded?.exp).toBeDefined();
      expect(decoded?.exp).toBeGreaterThan(decoded?.iat!);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid JWT with 3 parts', () => {
      const token = generateRefreshToken(mockPayload);
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
    });

    it('should produce a token that verifyToken accepts', () => {
      const token = generateRefreshToken(mockPayload);
      const verified = verifyToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.sub).toBe('user-123');
    });

    it('should have longer expiry than access token', () => {
      const accessToken = generateAccessToken(mockPayload);
      const refreshToken = generateRefreshToken(mockPayload);
      const accessDecoded = decodeToken(accessToken);
      const refreshDecoded = decodeToken(refreshToken);
      expect(refreshDecoded?.exp).toBeGreaterThan(accessDecoded?.exp!);
    });
  });

  describe('verifyToken', () => {
    it('should return payload when token is valid', () => {
      const token = generateAccessToken(mockPayload);
      const result = verifyToken(token);
      expect(result).toEqual(expect.objectContaining({
        sub: 'user-123',
        email: 'test@company.com',
        role: 'STAFF',
        deptId: 'dept-1',
      }));
    });

    it('should return null when token signature is tampered', () => {
      const token = generateAccessToken(mockPayload);
      const parts = token.split('.');
      // Tamper with the signature
      const tampered = `${parts[0]}.${parts[1]}.tampered-signature`;
      const result = verifyToken(tampered);
      expect(result).toBeNull();
    });

    it('should return null when token payload is tampered', () => {
      const token = generateAccessToken(mockPayload);
      const parts = token.split('.');
      // Tamper with the payload
      const tampered = `${parts[0]}.eyJzdWIiOiJhY2Nlc3NlZCJ9.${parts[2]}`;
      const result = verifyToken(tampered);
      expect(result).toBeNull();
    });

    it('should return null for malformed token', () => {
      const result = verifyToken('not.a.jwt');
      expect(result).toBeNull();
    });

    it('should return null for completely invalid token', () => {
      const result = verifyToken('invalid');
      expect(result).toBeNull();
    });
  });

  describe('decodeToken', () => {
    it('should return payload when token is decodable', () => {
      const token = generateAccessToken(mockPayload);
      const result = decodeToken(token);
      expect(result).toEqual(expect.objectContaining({
        sub: 'user-123',
        email: 'test@company.com',
        role: 'STAFF',
        deptId: 'dept-1',
      }));
    });

    it('should return null for malformed token', () => {
      const result = decodeToken('not.a.jwt');
      expect(result).toBeNull();
    });

    it('should return null for invalid base64', () => {
      const result = decodeToken('invalid.token.here');
      expect(result).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return true when token has no exp claim', () => {
      // Create a token without exp by manipulating the payload
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const payload = btoa(JSON.stringify({ ...mockPayload })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const signature = btoa(`${header}.${payload}.secret`).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const token = `${header}.${payload}.${signature}`;
      
      const result = isTokenExpired(token);
      expect(result).toBe(true);
    });

    it('should return true when token is expired', () => {
      // Create a token with an expired timestamp in the past
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const now = Math.floor(Date.now() / 1000);
      const expiredPayload = { ...mockPayload, iat: now - 7200, exp: now - 3600 };
      const payload = btoa(JSON.stringify(expiredPayload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const signature = btoa(`${header}.${payload}.secret`).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const token = `${header}.${payload}.${signature}`;
      
      const result = isTokenExpired(token);
      expect(result).toBe(true);
    });

    it('should return false when token is not expired', () => {
      const validPayload = { ...mockPayload, exp: Math.floor(Date.now() / 1000) + 3600 };
      const token = generateAccessToken(validPayload);
      const result = isTokenExpired(token);
      expect(result).toBe(false);
    });

    it('should return true when decode returns null', () => {
      const result = isTokenExpired('invalid.token.here');
      expect(result).toBe(true);
    });
  });

  describe('createTokenPayload', () => {
    it('should create correct TokenPayload from user', () => {
      const result = createTokenPayload(mockUser);
      expect(result).toEqual({
        sub: 'user-123',
        email: 'test@company.com',
        role: 'STAFF',
        deptId: 'dept-1',
      });
    });

    it('should handle null departmentId', () => {
      const userWithoutDept = { ...mockUser, departmentId: null };
      const result = createTokenPayload(userWithoutDept);
      expect(result.deptId).toBeNull();
    });
  });
});