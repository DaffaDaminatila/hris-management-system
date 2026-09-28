import { mockDb, calculateLeaveDays } from './mockDb';
import type { LeaveRequest, CreateLeaveData, LeaveListParams, Paginated, LeaveQuotaType, LeaveBalance } from '../types/index';

export const leaveApi = {
  async list(params?: LeaveListParams): Promise<Paginated<LeaveRequest>> {
    const all = await mockDb.getLeaveRequests({
      userId: params?.userId,
      status: params?.status,
    });

    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      data: all.slice(start, end),
      total: all.length,
      page,
      limit,
    };
  },

  async create(data: CreateLeaveData, userId: string): Promise<LeaveRequest> {
    // Validate quota for types that have quotas
    if (data.type !== 'OTHER') {
      const days = calculateLeaveDays(data.startDate, data.endDate);
      const { available, remaining } = await mockDb.checkQuotaAvailable(
        userId,
        data.type as LeaveQuotaType,
        days
      );
      if (!available) {
        throw new Error(
          `Insufficient leave quota. You have ${remaining} day(s) remaining for ${data.type} leave, but requested ${days} day(s).`
        );
      }
    }

    const leave = await mockDb.createLeaveRequest({
      ...data,
      userId,
    });

    // Send notifications to managers/HR
    try {
      const requester = await mockDb.findUserById(userId);
      const managers = (await mockDb.getAllUsers()).filter(
        u => u.role === 'MANAGER' || u.role === 'HR'
      );
      
      const days = calculateLeaveDays(data.startDate, data.endDate);
      const typeLabel = data.type.charAt(0) + data.type.slice(1).toLowerCase();
      
      for (const manager of managers) {
        await mockDb.createNotification({
          userId: manager.id,
          type: 'LEAVE_SUBMITTED',
          title: `New ${typeLabel} Leave Request`,
          message: `${requester?.fullName || 'A staff member'} requested ${days} day(s) of ${typeLabel} leave (${data.startDate} to ${data.endDate}). Reason: ${data.reason}`,
          relatedLeaveId: leave.id,
        });

        await mockDb.sendEmail(
          manager.email,
          `[HRIS Cuti] New ${typeLabel} Leave Request from ${requester?.fullName}`,
          `Hello ${manager.fullName},\n\n${requester?.fullName} (${requester?.email}) has submitted a ${typeLabel} leave request:\n\n- Dates: ${data.startDate} to ${data.endDate} (${days} working day(s))\n- Reason: ${data.reason}\n\nPlease review and approve/reject this request in the HRIS Cuti system.\n\nBest regards,\nHRIS Cuti System`,
          'LEAVE_SUBMITTED'
        );
      }
    } catch (err) {
      // Don't fail the request if notification fails
      console.warn('Failed to send notifications:', err);
    }

    return leave;
  },

  async approve(id: string, approverId: string, status: 'APPROVED' | 'REJECTED'): Promise<LeaveRequest | null> {
    const leave = await mockDb.findLeaveById(id);
    if (!leave) return null;

    const result = await mockDb.approveLeaveRequest(id, approverId, status);
    if (!result) return null;

    // Deduct quota on approval (only for quota-based types)
    if (status === 'APPROVED' && leave.type !== 'OTHER') {
      try {
        const days = calculateLeaveDays(leave.startDate, leave.endDate);
        await mockDb.deductQuota(leave.userId, leave.type as LeaveQuotaType, days);
      } catch (err) {
        console.warn('Failed to deduct quota:', err);
      }
    }

    // Notify the requester
    try {
      const requester = await mockDb.findUserById(leave.userId);
      const approver = await mockDb.findUserById(approverId);
      const days = calculateLeaveDays(leave.startDate, leave.endDate);
      const typeLabel = leave.type.charAt(0) + leave.type.slice(1).toLowerCase();
      
      if (requester) {
        const statusLabel = status === 'APPROVED' ? 'approved' : 'rejected';
        await mockDb.createNotification({
          userId: requester.id,
          type: status === 'APPROVED' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
          title: `Leave Request ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
          message: `Your ${typeLabel} leave request (${leave.startDate} to ${leave.endDate}, ${days} day(s)) has been ${statusLabel} by ${approver?.fullName || 'your manager'}.`,
          relatedLeaveId: leave.id,
        });

        await mockDb.sendEmail(
          requester.email,
          `[HRIS Cuti] Your Leave Request has been ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
          `Hello ${requester.fullName},\n\nYour ${typeLabel} leave request has been ${statusLabel}:\n\n- Dates: ${leave.startDate} to ${leave.endDate} (${days} working day(s))\n- Status: ${status}\n- Reviewed by: ${approver?.fullName || 'your manager'}\n${status === 'APPROVED' && leave.type !== 'OTHER' ? `\nYour ${typeLabel} leave quota has been automatically deducted by ${days} day(s).` : ''}\n\nBest regards,\nHRIS Cuti System`,
          status === 'APPROVED' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED'
        );
      }
    } catch (err) {
      console.warn('Failed to send approval notification:', err);
    }

    return result;
  },

  async getById(id: string): Promise<LeaveRequest | null> {
    return mockDb.findLeaveById(id);
  },

  async getByUser(userId: string): Promise<LeaveRequest[]> {
    return mockDb.getLeaveRequests({ userId });
  },

  async getPendingForDepartment(_departmentId: string): Promise<LeaveRequest[]> {
    const all = await mockDb.getLeaveRequests({ status: 'PENDING' });
    // In real app, filter by department
    return all;
  },

  // Quota methods
  async getBalance(userId: string, year?: number): Promise<LeaveBalance[]> {
    return mockDb.getUserBalance(userId, year);
  },

  async checkQuota(userId: string, type: LeaveQuotaType, days: number, year?: number): Promise<{ available: boolean; remaining: number }> {
    return mockDb.checkQuotaAvailable(userId, type, days, year);
  },
};
