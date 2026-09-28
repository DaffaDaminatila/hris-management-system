export type Role = 'STAFF' | 'MANAGER' | 'HR';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  departmentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
  deptId: string | null;
  iat?: number;
  exp?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  role: Role;
  departmentId?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface MeResponse {
  user: User;
}
