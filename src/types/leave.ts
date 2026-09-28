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

export interface Department {
  id: string;
  name: string;
  managerId: string | null;
}
