import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApi } from '../services/leave';
import { mockDb } from '../services/mockDb';
import type { CreateLeaveData, LeaveListParams, LeaveQuotaType } from '../types/index';

const LEAVE_QUERY_KEY = ['leaves'];
const QUOTA_QUERY_KEY = ['leave-quotas'];
const NOTIFICATION_QUERY_KEY = ['notifications'];

export function useLeaves(params?: LeaveListParams) {
  return useQuery({
    queryKey: [...LEAVE_QUERY_KEY, params],
    queryFn: () => leaveApi.list(params),
  });
}

export function useUserLeaves(userId: string) {
  return useQuery({
    queryKey: [...LEAVE_QUERY_KEY, 'user', userId],
    queryFn: () => leaveApi.getByUser(userId),
    enabled: !!userId,
  });
}

export function useLeaveById(id: string) {
  return useQuery({
    queryKey: [...LEAVE_QUERY_KEY, id],
    queryFn: () => leaveApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, userId }: { data: CreateLeaveData; userId: string }) =>
      leaveApi.create(data, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: LEAVE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...QUOTA_QUERY_KEY, variables.userId] });
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEY });
    },
  });
}

export function useApproveLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      approverId,
      status,
    }: {
      id: string;
      approverId: string;
      status: 'APPROVED' | 'REJECTED';
    }) => leaveApi.approve(id, approverId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAVE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: QUOTA_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEY });
    },
  });
}

// Leave Quota hooks
export function useLeaveBalance(userId: string, year?: number) {
  return useQuery({
    queryKey: [...QUOTA_QUERY_KEY, userId, year],
    queryFn: () => leaveApi.getBalance(userId, year),
    enabled: !!userId,
  });
}

export function useCheckQuota(userId: string, type: LeaveQuotaType, days: number, year?: number) {
  return useQuery({
    queryKey: [...QUOTA_QUERY_KEY, 'check', userId, type, days, year],
    queryFn: () => leaveApi.checkQuota(userId, type, days, year),
    enabled: !!userId && days > 0,
  });
}

// Notification hooks
export function useNotifications(userId: string) {
  return useQuery({
    queryKey: [...NOTIFICATION_QUERY_KEY, userId],
    queryFn: () => mockDb.getUserNotifications(userId),
    enabled: !!userId,
    refetchInterval: 30000, // refresh every 30s
  });
}

export function useUnreadNotificationCount(userId: string) {
  return useQuery({
    queryKey: [...NOTIFICATION_QUERY_KEY, userId, 'unread'],
    queryFn: () => mockDb.getUserNotifications(userId, true),
    enabled: !!userId,
    refetchInterval: 15000, // refresh every 15s
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mockDb.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEY });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => mockDb.markAllNotificationsRead(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEY });
    },
  });
}
