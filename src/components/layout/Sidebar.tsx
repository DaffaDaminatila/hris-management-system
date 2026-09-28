import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getAllowedRoutes } from '../../utils/roles';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/leave/request', label: 'Request Leave', icon: '📝' },
  { path: '/leave/approval', label: 'Leave Approval', icon: '✅' },
  { path: '/users', label: 'Users', icon: '👥' },
  { path: '/departments', label: 'Departments', icon: '🏢' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  if (!user) return null;

  const allowedPaths = getAllowedRoutes(user.role);
  const navItems = ALL_NAV_ITEMS.filter(item => allowedPaths.includes(item.path));

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <span className="brand-icon">🏢</span>
          <span className="brand-text">HRIS Cuti</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list" role="list">
          {navItems.map(item => (
            <li key={item.path} className="nav-item">
              <button
                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
                aria-current={isActive(item.path) ? 'page' : undefined}
              >
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {isActive(item.path) && <span className="nav-indicator" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar" aria-hidden="true">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <span className="user-name">{user.fullName}</span>
            <span className={`user-role role-${user.role.toLowerCase()}`}>
              {user.role}
            </span>
          </div>
        </div>
        <button
          className="btn btn-secondary btn-block sidebar-logout"
          onClick={handleLogout}
        >
          <span aria-hidden="true">🚪</span> Logout
        </button>
      </div>
    </aside>
  );
}