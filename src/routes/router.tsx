import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense, type ComponentType } from 'react';
import { MainLayout, AuthLayout } from '../components/layout/MainLayout';
import { PrivateRoute } from '../components/guards/PrivateRoute';
import { RoleRoute } from '../components/guards/RoleRoute';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';

// Lazy load pages - use function that returns Promise with default export
const Dashboard = lazy(() => import('../pages/Dashboard').then(m => ({ default: m.Dashboard })));
const LeaveRequest = lazy(() => import('../pages/LeaveRequest').then(m => ({ default: m.LeaveRequest })));
const LeaveApproval = lazy(() => import('../pages/LeaveApproval').then(m => ({ default: m.LeaveApproval })));
const Users = lazy(() => import('../pages/Users').then(m => ({ default: m.Users })));
const Settings = lazy(() => import('../pages/Settings').then(m => ({ default: m.Settings })));

// Loading fallback for lazy components
function LoadingFallback() {
  return (
    <div className="loading-container" role="status" aria-label="Loading page">
      <div className="spinner" aria-hidden="true"></div>
      <p>Loading...</p>
    </div>
  );
}

// Wrapper for lazy components with Suspense
function withSuspense(Component: ComponentType<Record<string, unknown>>) {
  return function SuspenseWrapper({ children, ...props }: Record<string, unknown>) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

const DashboardWithSuspense = withSuspense(Dashboard);
const LeaveRequestWithSuspense = withSuspense(LeaveRequest);
const LeaveApprovalWithSuspense = withSuspense(LeaveApproval);
const UsersWithSuspense = withSuspense(Users);
const SettingsWithSuspense = withSuspense(Settings);

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <PrivateRoute>
        <MainLayout />
      </PrivateRoute>
    ),
    errorElement: <div className="error-page">Error loading app</div>,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardWithSuspense />,
      },
      {
        path: 'leave/request',
        element: <LeaveRequestWithSuspense />,
      },
      {
        path: 'leave/approval',
        element: (
          <RoleRoute allowedRoles={['MANAGER', 'HR']}>
            <LeaveApprovalWithSuspense />
          </RoleRoute>
        ),
      },
      {
        path: 'users',
        element: (
          <RoleRoute allowedRoles={['HR']}>
            <UsersWithSuspense />
          </RoleRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <RoleRoute allowedRoles={['HR']}>
            <SettingsWithSuspense />
          </RoleRoute>
        ),
      },
      {
        path: 'register',
        element: (
          <RoleRoute allowedRoles={['HR']}>
            <Register />
          </RoleRoute>
        ),
      },
    ],
  },
  {
    path: '/login',
    element: (
      <AuthLayout>
        <Login />
      </AuthLayout>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);

export default router;