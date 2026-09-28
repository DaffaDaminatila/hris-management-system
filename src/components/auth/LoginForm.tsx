import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { Role } from '../../types/index';

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const navigate = useNavigate();
  const { login, isLoginPending, error, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  if (user) {
    const dashboardRoutes: Record<Role, string> = {
      STAFF: '/dashboard',
      MANAGER: '/dashboard',
      HR: '/dashboard',
    };
    navigate(dashboardRoutes[user.role], { replace: true });
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
    if (onSuccess) onSuccess();
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Sign In</h1>
        <p className="auth-subtitle">Enter your credentials to access HRIS Cuti</p>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
              disabled={isLoginPending}
              aria-describedby="email-hint"
            />
            <span id="email-hint" className="form-hint">
              Use your company email address
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                disabled={isLoginPending}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isLoginPending || !email || !password}
          >
            {isLoginPending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-demo">
          <p className="demo-title">Demo Accounts</p>
          <ul className="demo-list">
            <li>
              <button
                type="button"
                className="demo-btn"
                onClick={() => {
                  setEmail('hr@company.com');
                  setPassword('password');
                }}
              >
                HR Admin
              </button>
            </li>
            <li>
              <button
                type="button"
                className="demo-btn"
                onClick={() => {
                  setEmail('manager@company.com');
                  setPassword('password');
                }}
              >
                Manager
              </button>
            </li>
            <li>
              <button
                type="button"
                className="demo-btn"
                onClick={() => {
                  setEmail('staff@company.com');
                  setPassword('password');
                }}
              >
                Staff
              </button>
            </li>
          </ul>
          <p className="demo-hint">Password for all: <code>password</code></p>
        </div>
      </div>
    </div>
  );
}