import type { TokenPayload, Role } from '../types/auth';

// Browser-compatible JWT utilities (no Node-only deps like `jsonwebtoken`).
// The signature scheme is a demo-grade HMAC-like btoa construction; a real
// deployment should use Web Crypto (crypto.subtle) and/or a server.

const JWT_SECRET = import.meta.env.VITE_JWT_SECRET || 'hris-cuti-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60; // 15 minutes
const REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

function base64UrlEncode(input: string): string {
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return atob(padded);
}

function sign(input: string, secret: string): string {
  // Demo-grade "signature": deterministic encoding of input + secret.
  return base64UrlEncode(`${input}.${secret}`);
}

function generate(payload: TokenPayload, expirySeconds: number): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: TokenPayload & { iat: number; exp: number } = {
    ...payload,
    iat: now,
    exp: now + expirySeconds,
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = sign(`${headerB64}.${payloadB64}`, JWT_SECRET);

  return `${headerB64}.${payloadB64}.${signature}`;
}

export function generateAccessToken(payload: TokenPayload): string {
  return generate(payload, ACCESS_TOKEN_EXPIRY_SECONDS);
}

export function generateRefreshToken(payload: TokenPayload): string {
  return generate(payload, REFRESH_TOKEN_EXPIRY_SECONDS);
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const expected = sign(`${headerB64}.${payloadB64}`, JWT_SECRET);
    if (signatureB64 !== expected) return null;

    const payload = JSON.parse(base64UrlDecode(payloadB64)) as TokenPayload;

    if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(base64UrlDecode(parts[1])) as TokenPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload || !('exp' in payload)) return true;
  const exp = (payload as { exp: number }).exp * 1000;
  return Date.now() >= exp;
}

export function createTokenPayload(user: { id: string; email: string; role: Role; departmentId: string | null }): TokenPayload {
  return {
    sub: user.id,
    email: user.email,
    role: user.role,
    deptId: user.departmentId,
  };
}
