import type { Role } from '../types/auth';

export const ROLE_HIERARCHY: Record<Role, number> = {
  STAFF: 1,
  MANAGER: 2,
  HR: 3,
};

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canAccessRoute(role: Role, route: string): boolean {
  const routePermissions: Record<string, Role[]> = {
    '/dashboard': ['STAFF', 'MANAGER', 'HR'],
    '/leave/request': ['STAFF', 'MANAGER', 'HR'],
    '/leave/approval': ['MANAGER', 'HR'],
    '/users': ['HR'],
    '/departments': ['MANAGER', 'HR'],
    '/settings': ['HR'],
  };

  const allowedRoles = routePermissions[route];
  if (!allowedRoles) return true;
  return allowedRoles.includes(role);
}

export function getDashboardRoute(): string {
  return '/dashboard';
}

export function getAllowedRoutes(role: Role): string[] {
  const allRoutes = [
    '/dashboard',
    '/leave/request',
    '/leave/approval',
    '/users',
    '/departments',
    '/settings',
  ];
  return allRoutes.filter(route => canAccessRoute(role, route));
}