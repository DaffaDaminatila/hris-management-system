import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useUnreadNotificationCount, useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../../hooks/useLeave';
import type { Role, Notification, NotificationType } from '../../types/index';

export function Header() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationBellRef = useRef<HTMLDivElement>(null);
  const { data: unreadNotifications } = useUnreadNotificationCount(user?.id || '');
  const { data: notifications } = useNotifications(user?.id || '');
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  if (!isAuthenticated || !user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getRoleColor = (role: Role) => {
    switch (role) {
      case 'HR': return 'role-hr';
      case 'MANAGER': return 'role-manager';
      case 'STAFF': return 'role-staff';
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'LEAVE_SUBMITTED': return '📝';
      case 'LEAVE_APPROVED': return '✅';
      case 'LEAVE_REJECTED': return '❌';
      case 'LEAVE_CANCELLED': return '🗑️';
    }
  };

  const getNotificationIconClass = (type: NotificationType) => {
    switch (type) {
      case 'LEAVE_SUBMITTED': return 'submitted';
      case 'LEAVE_APPROVED': return 'approved';
      case 'LEAVE_REJECTED': return 'rejected';
      case 'LEAVE_CANCELLED': return 'cancelled';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markRead.mutateAsync(notification.id);
    }
    if (notification.relatedLeaveId) {
      if (notification.type === 'LEAVE_SUBMITTED') {
        navigate('/leave/approval');
      } else {
        navigate('/leave/request');
      }
    }
    setShowNotificationDropdown(false);
  };

  const handleMarkAllRead = async () => {
    if (user?.id) {
      await markAllRead.mutateAsync(user.id);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (notificationBellRef.current && !notificationBellRef.current.contains(event.target as Node)) {
        setShowNotificationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = unreadNotifications?.length || 0;

  return (
    <header className="header" role="banner">
      <div className="header-left">
        <button className="menu-toggle" aria-label="Toggle menu" aria-expanded="false">
          <span aria-hidden="true">☰</span>
        </button>
        <h1 className="page-title">
          {document.title.replace(' - HRIS Cuti', '') || 'Dashboard'}
        </h1>
      </div>

      <div className="header-right">
        {/* Notification Bell */}
        <div className="notification-bell-wrapper" ref={notificationBellRef}>
          <button
            className="notification-bell"
            onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            aria-expanded={showNotificationDropdown}
            aria-haspopup="true"
          >
            <span aria-hidden="true">🔔</span>
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {showNotificationDropdown && (
            <div className="notification-dropdown" role="menu">
              <div className="notification-dropdown-header">
                <h3 className="notification-dropdown-title">Notifications</h3>
                {unreadCount > 0 && (
                  <button className="mark-all-read" onClick={handleMarkAllRead}>
                    Mark all read
                  </button>
                )}
              </div>
              <div className="notification-list" role="list">
                {!notifications || notifications.length === 0 ? (
                  <div className="notification-empty">
                    <span className="notification-empty-icon">🔔</span>
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(notification => (
                    <button
                      key={notification.id}
                      className={`notification-item ${!notification.read ? 'unread' : ''}`}
                      role="menuitem"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className={`notification-icon ${getNotificationIconClass(notification.type)}`} aria-hidden="true">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="notification-content">
                        <h4 className="notification-title">{notification.title}</h4>
                        <p className="notification-message">{notification.message}</p>
                        <span className="notification-time">{formatTime(notification.createdAt)}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="user-menu" ref={userMenuRef}>
          <button
            className="user-trigger"
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            aria-expanded={showUserDropdown}
            aria-haspopup="true"
          >
            <div className="user-avatar" aria-hidden="true">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="user-info-text">
              <span className="user-name">{user.fullName}</span>
              <span className={`user-role-badge ${getRoleColor(user.role)}`}>
                {user.role}
              </span>
            </div>
            <span className="dropdown-arrow" aria-hidden="true">▼</span>
          </button>

          {showUserDropdown && (
            <div className="user-dropdown" role="menu">
              <div className="dropdown-header">
                <div className="dropdown-avatar" aria-hidden="true">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="dropdown-name">{user.fullName}</span>
                  <span className={`dropdown-role ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                </div>
              </div>
              <div className="dropdown-divider" role="separator" />
              <button className="dropdown-item" role="menuitem" onClick={() => { navigate('/settings'); setShowUserDropdown(false); }}>
                <span aria-hidden="true">⚙️</span> Settings
              </button>
              <button className="dropdown-item" role="menuitem" onClick={() => { navigate('/profile'); setShowUserDropdown(false); }}>
                <span aria-hidden="true">👤</span> Profile
              </button>
              <div className="dropdown-divider" role="separator" />
              <button className="dropdown-item dropdown-danger" role="menuitem" onClick={handleLogout}>
                <span aria-hidden="true">🚪</span> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}