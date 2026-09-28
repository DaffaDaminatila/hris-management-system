import type { User, Department, LeaveRequest, LeaveQuota, LeaveQuotaType, Notification, NotificationType, EmailLog, LeaveBalance } from '../types/index';
import { DEFAULT_ENTITLEMENTS } from '../types/index';

// In-memory storage with localStorage persistence
const STORAGE_KEYS = {
  USERS: 'hris_users',
  DEPARTMENTS: 'hris_departments',
  LEAVE_REQUESTS: 'hris_leave_requests',
  LEAVE_QUOTAS: 'hris_leave_quotas',
  NOTIFICATIONS: 'hris_notifications',
  EMAIL_LOGS: 'hris_email_logs',
} as const;

// Helper: calculate working days between two dates (inclusive, excluding weekends)
export function calculateLeaveDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let days = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) days++; // exclude weekends
    current.setDate(current.getDate() + 1);
  }
  return days || 1;
}

function generateId(): string {
  return crypto.randomUUID();
}

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Initialize with seed data
const seedUsers: User[] = [
  {
    id: '1',
    email: 'hr@company.com',
    passwordHash: '$2a$10$dummy_hash_password', // password is "password" for all demo accounts
    fullName: 'HR Admin',
    role: 'HR',
    departmentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'manager@company.com',
    passwordHash: '$2a$10$dummy_hash_password', // password is "password" for all demo accounts
    fullName: 'John Manager',
    role: 'MANAGER',
    departmentId: 'dept-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    email: 'staff@company.com',
    passwordHash: '$2a$10$dummy_hash_password', // password is "password" for all demo accounts
    fullName: 'Jane Staff',
    role: 'STAFF',
    departmentId: 'dept-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const seedDepartments: Department[] = [
  { id: 'dept-1', name: 'Engineering', managerId: '2' },
  { id: 'dept-2', name: 'Marketing', managerId: null },
  { id: 'dept-3', name: 'Sales', managerId: null },
];

const seedLeaveRequests: LeaveRequest[] = [];

const seedQuotas: LeaveQuota[] = [];
const seedNotifications: Notification[] = [];
const seedEmailLogs: EmailLog[] = [];

// Initialize storage
let users = loadFromStorage<User[]>(STORAGE_KEYS.USERS, seedUsers);
let departments = loadFromStorage<Department[]>(STORAGE_KEYS.DEPARTMENTS, seedDepartments);
let leaveRequests = loadFromStorage<LeaveRequest[]>(STORAGE_KEYS.LEAVE_REQUESTS, seedLeaveRequests);
let leaveQuotas = loadFromStorage<LeaveQuota[]>(STORAGE_KEYS.LEAVE_QUOTAS, seedQuotas);
let notifications = loadFromStorage<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, seedNotifications);
let emailLogs = loadFromStorage<EmailLog[]>(STORAGE_KEYS.EMAIL_LOGS, seedEmailLogs);

// Initialize quotas for existing users if not exists
function initializeUserQuotas(userId: string, year?: number): void {
  const targetYear = year || new Date().getFullYear();
  const existing = leaveQuotas.filter(q => q.userId === userId && q.year === targetYear);
  
  (Object.keys(DEFAULT_ENTITLEMENTS) as LeaveQuotaType[]).forEach(type => {
    if (!existing.find(q => q.type === type)) {
      const entitlement = DEFAULT_ENTITLEMENTS[type];
      leaveQuotas.push({
        id: generateId(),
        userId,
        year: targetYear,
        type,
        entitlement,
        used: 0,
        remaining: entitlement,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  });
}

// Ensure quotas for all users on startup
users.forEach(u => initializeUserQuotas(u.id));

// Save initial data if not exists
if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
  saveToStorage(STORAGE_KEYS.USERS, users);
}
if (!localStorage.getItem(STORAGE_KEYS.DEPARTMENTS)) {
  saveToStorage(STORAGE_KEYS.DEPARTMENTS, departments);
}
if (!localStorage.getItem(STORAGE_KEYS.LEAVE_REQUESTS)) {
  saveToStorage(STORAGE_KEYS.LEAVE_REQUESTS, leaveRequests);
}
if (!localStorage.getItem(STORAGE_KEYS.LEAVE_QUOTAS)) {
  saveToStorage(STORAGE_KEYS.LEAVE_QUOTAS, leaveQuotas);
}
if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
  saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
}
if (!localStorage.getItem(STORAGE_KEYS.EMAIL_LOGS)) {
  saveToStorage(STORAGE_KEYS.EMAIL_LOGS, emailLogs);
}

// Simulate network delay
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Password verification (dummy - in real app use bcrypt)
function verifyPassword(password: string, hash: string): boolean {
  return hash.includes(password) || hash === `$2a$10$dummy_hash_${password}`;
}

function hashPassword(password: string): string {
  return `$2a$10$dummy_hash_${password}`;
}

export const mockDb = {
  // Users
  async findUserByEmail(email: string): Promise<User | null> {
    await delay();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async findUserById(id: string): Promise<User | null> {
    await delay();
    return users.find(u => u.id === id) || null;
  },

  async createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'passwordHash'> & { password: string }): Promise<User> {
    await delay();
    const newUser: User = {
      ...data,
      id: generateId(),
      passwordHash: hashPassword(data.password),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.push(newUser);
    saveToStorage(STORAGE_KEYS.USERS, users);
    return newUser;
  },

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    await delay();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;
    users[index] = { ...users[index], ...data, updatedAt: new Date().toISOString() };
    saveToStorage(STORAGE_KEYS.USERS, users);
    return users[index];
  },

  async getAllUsers(): Promise<User[]> {
    await delay();
    return [...users];
  },

  // Departments
  async getAllDepartments(): Promise<Department[]> {
    await delay();
    return [...departments];
  },

  async findDepartmentById(id: string): Promise<Department | null> {
    await delay();
    return departments.find(d => d.id === id) || null;
  },

  async createDepartment(data: Omit<Department, 'id'>): Promise<Department> {
    await delay();
    const newDept: Department = { ...data, id: generateId() };
    departments.push(newDept);
    saveToStorage(STORAGE_KEYS.DEPARTMENTS, departments);
    return newDept;
  },

  async updateDepartment(id: string, data: Partial<Department>): Promise<Department | null> {
    await delay();
    const index = departments.findIndex(d => d.id === id);
    if (index === -1) return null;
    departments[index] = { ...departments[index], ...data };
    saveToStorage(STORAGE_KEYS.DEPARTMENTS, departments);
    return departments[index];
  },

  // Leave Requests
  async getLeaveRequests(params?: { userId?: string; status?: string }): Promise<LeaveRequest[]> {
    await delay();
    let result = [...leaveRequests];
    if (params?.userId) {
      result = result.filter(lr => lr.userId === params.userId);
    }
    if (params?.status) {
      result = result.filter(lr => lr.status === params.status);
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async findLeaveById(id: string): Promise<LeaveRequest | null> {
    await delay();
    return leaveRequests.find(lr => lr.id === id) || null;
  },

  async createLeaveRequest(data: Omit<LeaveRequest, 'id' | 'status' | 'approvedBy' | 'approvedAt' | 'createdAt'>): Promise<LeaveRequest> {
    await delay();
    const newLeave: LeaveRequest = {
      ...data,
      id: generateId(),
      status: 'PENDING',
      approvedBy: null,
      approvedAt: null,
      createdAt: new Date().toISOString(),
    };
    leaveRequests.push(newLeave);
    saveToStorage(STORAGE_KEYS.LEAVE_REQUESTS, leaveRequests);
    return newLeave;
  },

  async approveLeaveRequest(id: string, approverId: string, status: 'APPROVED' | 'REJECTED'): Promise<LeaveRequest | null> {
    await delay();
    const index = leaveRequests.findIndex(lr => lr.id === id);
    if (index === -1) return null;
    leaveRequests[index] = {
      ...leaveRequests[index],
      status,
      approvedBy: approverId,
      approvedAt: new Date().toISOString(),
    };
    saveToStorage(STORAGE_KEYS.LEAVE_REQUESTS, leaveRequests);
    return leaveRequests[index];
  },

  // Leave Quotas
  async getUserQuotas(userId: string, year?: number): Promise<LeaveQuota[]> {
    await delay();
    const targetYear = year || new Date().getFullYear();
    return leaveQuotas.filter(q => q.userId === userId && q.year === targetYear);
  },

  async getUserBalance(userId: string, year?: number): Promise<LeaveBalance[]> {
    await delay();
    const quotas = await mockDb.getUserQuotas(userId, year);
    return quotas.map(q => ({
      type: q.type,
      entitlement: q.entitlement,
      used: q.used,
      remaining: q.remaining,
      percentage: q.entitlement > 0 ? Math.round((q.used / q.entitlement) * 100) : 0,
    }));
  },

  async checkQuotaAvailable(userId: string, type: LeaveQuotaType, days: number, year?: number): Promise<{ available: boolean; remaining: number }> {
    await delay();
    const targetYear = year || new Date().getFullYear();
    const quota = leaveQuotas.find(q => q.userId === userId && q.year === targetYear && q.type === type);
    if (!quota) return { available: true, remaining: 999 }; // no quota limit set
    if (type === 'OTHER' as LeaveQuotaType) return { available: true, remaining: 999 }; // unlimited
    return { available: quota.remaining >= days, remaining: quota.remaining };
  },

  async deductQuota(userId: string, type: LeaveQuotaType, days: number, year?: number): Promise<LeaveQuota | null> {
    await delay();
    const targetYear = year || new Date().getFullYear();
    const index = leaveQuotas.findIndex(q => q.userId === userId && q.year === targetYear && q.type === type);
    if (index === -1) return null;
    leaveQuotas[index] = {
      ...leaveQuotas[index],
      used: leaveQuotas[index].used + days,
      remaining: Math.max(0, leaveQuotas[index].remaining - days),
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(STORAGE_KEYS.LEAVE_QUOTAS, leaveQuotas);
    return leaveQuotas[index];
  },

  async restoreQuota(userId: string, type: LeaveQuotaType, days: number, year?: number): Promise<LeaveQuota | null> {
    await delay();
    const targetYear = year || new Date().getFullYear();
    const index = leaveQuotas.findIndex(q => q.userId === userId && q.year === targetYear && q.type === type);
    if (index === -1) return null;
    leaveQuotas[index] = {
      ...leaveQuotas[index],
      used: Math.max(0, leaveQuotas[index].used - days),
      remaining: leaveQuotas[index].remaining + days,
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(STORAGE_KEYS.LEAVE_QUOTAS, leaveQuotas);
    return leaveQuotas[index];
  },

  // Notifications
  async createNotification(data: Omit<Notification, 'id' | 'read' | 'createdAt'>): Promise<Notification> {
    await delay();
    const notification: Notification = {
      ...data,
      id: generateId(),
      read: false,
      createdAt: new Date().toISOString(),
    };
    notifications.push(notification);
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
    return notification;
  },

  async getUserNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
    await delay();
    let result = notifications.filter(n => n.userId === userId);
    if (unreadOnly) result = result.filter(n => !n.read);
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async markNotificationRead(id: string): Promise<Notification | null> {
    await delay();
    const index = notifications.findIndex(n => n.id === id);
    if (index === -1) return null;
    notifications[index] = { ...notifications[index], read: true };
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
    return notifications[index];
  },

  async markAllNotificationsRead(userId: string): Promise<void> {
    await delay();
    notifications = notifications.map(n => 
      n.userId === userId ? { ...n, read: true } : n
    );
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
  },

  // Email Mock
  async sendEmail(to: string, subject: string, body: string, type: NotificationType): Promise<EmailLog> {
    await delay();
    const email: EmailLog = {
      id: generateId(),
      to,
      subject,
      body,
      type,
      sentAt: new Date().toISOString(),
    };
    emailLogs.push(email);
    saveToStorage(STORAGE_KEYS.EMAIL_LOGS, emailLogs);
    console.log('📧 EMAIL SENT:', { to, subject, type });
    return email;
  },

  async getEmailLogs(): Promise<EmailLog[]> {
    await delay();
    return [...emailLogs].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  },

  // Auth helpers
  async verifyCredentials(email: string, password: string): Promise<User | null> {
    await delay();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    if (!verifyPassword(password, user.passwordHash)) return null;
    return user;
  },
};