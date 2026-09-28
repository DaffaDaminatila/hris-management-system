import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Header } from './Header';
import type { Role } from '../../types/index';

export function MainLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', roles: ['STAFF', 'MANAGER', 'HR'] as Role[] },
    { path: '/leave/request', label: 'Leave Request', roles: ['STAFF', 'MANAGER', 'HR'] as Role[] },
    { path: '/leave/approval', label: 'Leave Approval', roles: ['MANAGER', 'HR'] as Role[] },
    { path: '/users', label: 'Users', roles: ['HR'] as Role[] },
    { path: '/settings', label: 'Settings', roles: ['HR'] as Role[] },
  ];

  const filteredNav = navItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="app-layout">
      <aside className="sidebar" role="navigation" aria-label="Main navigation">
        <div className="sidebar-header">
          <h1 className="sidebar-title">HRIS Cuti</h1>
        </div>
        <nav className="sidebar-nav">
          <ul className="nav-list" role="list">
            {filteredNav.map(item => (
              <li key={item.path} className="nav-item">
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  aria-current={location.pathname === item.path ? 'page' : undefined}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name">{user?.fullName}</span>
            <span className="user-role">{user?.role}</span>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-secondary btn-block"
            aria-label="Sign out"
          >
            Sign Out
          </button>
        </div>
      </aside>
      <main className="main-content" role="main">
        <Header />
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-layout">
      <main className="auth-main" role="main">
        {children}
      </main>
    </div>
  );
}