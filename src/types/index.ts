export type Role = 'STAFF' | 'MANAGER' | 'HR';

export interface Department {
  id: string;
  name: string;
  managerId: string | null;
}

export interface User {
  id: string;
  email: string;
  /** Demo-only reversible hash. Production: bcrypt server-side. */
  passwordHash: string;
  fullName: string;
  role: Role;
  departmentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type LeaveType = 'ANNUAL' | 'SICK' | 'PERSONAL' | 'OTHER';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveRequest {
  id: string;
  userId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
}

export interface CreateLeaveData {
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface LeaveListParams {
  page?: number;
  limit?: number;
  status?: LeaveStatus;
  userId?: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
  deptId: string | null;
  iat: number;
  exp: number;
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

// Leave Quota
export type LeaveQuotaType = 'ANNUAL' | 'SICK' | 'PERSONAL';

export interface LeaveQuota {
  id: string;
  userId: string;
  year: number;
  type: LeaveQuotaType;
  entitlement: number;
  used: number;
  remaining: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  type: LeaveQuotaType;
  entitlement: number;
  used: number;
  remaining: number;
  percentage: number;
}

// Notifications
export type NotificationType =
  | 'LEAVE_SUBMITTED'
  | 'LEAVE_APPROVED'
  | 'LEAVE_REJECTED'
  | 'LEAVE_CANCELLED';

export interface Notification {
  id: string;
  userId: string;           // recipient
  type: NotificationType;
  title: string;
  message: string;
  relatedLeaveId?: string;
  read: boolean;
  createdAt: string;
}

// Email Mock
export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  type: NotificationType;
  sentAt: string;
}

// Default entitlements per leave type (days per year)
export const DEFAULT_ENTITLEMENTS: Record<LeaveQuotaType, number> = {
  ANNUAL: 12,
  SICK: 10,
  PERSONAL: 3,
};
