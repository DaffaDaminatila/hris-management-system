import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: Array<'STAFF' | 'MANAGER' | 'HR'>;
  fallbackPath?: string;
}

export function RoleRoute({ children, allowedRoles, fallbackPath = '/dashboard' }: RoleRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-container" role="status" aria-label="Checking permissions">
        <div className="spinner" aria-hidden="true"></div>
        <p>Verifying permissions...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}