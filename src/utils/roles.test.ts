import { describe, it, expect } from 'vitest';
import { ROLE_HIERARCHY, hasRole, canAccessRoute, getDashboardRoute, getAllowedRoutes } from './roles';

describe('roles utilities', () => {
  describe('ROLE_HIERARCHY', () => {
    it('should have correct hierarchy values', () => {
      expect(ROLE_HIERARCHY.STAFF).toBe(1);
      expect(ROLE_HIERARCHY.MANAGER).toBe(2);
      expect(ROLE_HIERARCHY.HR).toBe(3);
    });

    it('should have HR > MANAGER > STAFF', () => {
      expect(ROLE_HIERARCHY.HR).toBeGreaterThan(ROLE_HIERARCHY.MANAGER);
      expect(ROLE_HIERARCHY.MANAGER).toBeGreaterThan(ROLE_HIERARCHY.STAFF);
    });
  });

  describe('hasRole', () => {
    it('should return true when user role equals required role', () => {
      expect(hasRole('STAFF', 'STAFF')).toBe(true);
      expect(hasRole('MANAGER', 'MANAGER')).toBe(true);
      expect(hasRole('HR', 'HR')).toBe(true);
    });

    it('should return true when user role is higher than required', () => {
      expect(hasRole('MANAGER', 'STAFF')).toBe(true);
      expect(hasRole('HR', 'STAFF')).toBe(true);
      expect(hasRole('HR', 'MANAGER')).toBe(true);
    });

    it('should return false when user role is lower than required', () => {
      expect(hasRole('STAFF', 'MANAGER')).toBe(false);
      expect(hasRole('STAFF', 'HR')).toBe(false);
      expect(hasRole('MANAGER', 'HR')).toBe(false);
    });
  });

  describe('canAccessRoute', () => {
    it('should allow STAFF to access dashboard', () => {
      expect(canAccessRoute('STAFF', '/dashboard')).toBe(true);
    });

    it('should allow STAFF to access leave request', () => {
      expect(canAccessRoute('STAFF', '/leave/request')).toBe(true);
    });

    it('should deny STAFF access to leave approval', () => {
      expect(canAccessRoute('STAFF', '/leave/approval')).toBe(false);
    });

    it('should deny STAFF access to users', () => {
      expect(canAccessRoute('STAFF', '/users')).toBe(false);
    });

    it('should deny STAFF access to departments', () => {
      expect(canAccessRoute('STAFF', '/departments')).toBe(false);
    });

    it('should deny STAFF access to settings', () => {
      expect(canAccessRoute('STAFF', '/settings')).toBe(false);
    });

    it('should allow MANAGER to access dashboard', () => {
      expect(canAccessRoute('MANAGER', '/dashboard')).toBe(true);
    });

    it('should allow MANAGER to access leave request', () => {
      expect(canAccessRoute('MANAGER', '/leave/request')).toBe(true);
    });

    it('should allow MANAGER to access leave approval', () => {
      expect(canAccessRoute('MANAGER', '/leave/approval')).toBe(true);
    });

    it('should deny MANAGER access to users', () => {
      expect(canAccessRoute('MANAGER', '/users')).toBe(false);
    });

    it('should allow MANAGER to access departments', () => {
      expect(canAccessRoute('MANAGER', '/departments')).toBe(true);
    });

    it('should deny MANAGER access to settings', () => {
      expect(canAccessRoute('MANAGER', '/settings')).toBe(false);
    });

    it('should allow HR to access all routes', () => {
      expect(canAccessRoute('HR', '/dashboard')).toBe(true);
      expect(canAccessRoute('HR', '/leave/request')).toBe(true);
      expect(canAccessRoute('HR', '/leave/approval')).toBe(true);
      expect(canAccessRoute('HR', '/users')).toBe(true);
      expect(canAccessRoute('HR', '/departments')).toBe(true);
      expect(canAccessRoute('HR', '/settings')).toBe(true);
    });

    it('should allow access to unknown routes by default', () => {
      expect(canAccessRoute('STAFF', '/unknown-route')).toBe(true);
      expect(canAccessRoute('MANAGER', '/another-unknown')).toBe(true);
    });
  });

  describe('getDashboardRoute', () => {
    it('should return /dashboard', () => {
      expect(getDashboardRoute()).toBe('/dashboard');
    });
  });

  describe('getAllowedRoutes', () => {
    it('should return only allowed routes for STAFF', () => {
      const routes = getAllowedRoutes('STAFF');
      expect(routes).toContain('/dashboard');
      expect(routes).toContain('/leave/request');
      expect(routes).not.toContain('/leave/approval');
      expect(routes).not.toContain('/users');
      expect(routes).not.toContain('/departments');
      expect(routes).not.toContain('/settings');
    });

    it('should return allowed routes for MANAGER', () => {
      const routes = getAllowedRoutes('MANAGER');
      expect(routes).toContain('/dashboard');
      expect(routes).toContain('/leave/request');
      expect(routes).toContain('/leave/approval');
      expect(routes).not.toContain('/users');
      expect(routes).toContain('/departments');
      expect(routes).not.toContain('/settings');
    });

    it('should return all routes for HR', () => {
      const routes = getAllowedRoutes('HR');
      expect(routes).toContain('/dashboard');
      expect(routes).toContain('/leave/request');
      expect(routes).toContain('/leave/approval');
      expect(routes).toContain('/users');
      expect(routes).toContain('/departments');
      expect(routes).toContain('/settings');
    });
  });
});