import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types/index';

const ROLES: Role[] = ['STAFF', 'MANAGER', 'HR'];

export function Register() {
  const navigate = useNavigate();
  const { register, isRegisterPending, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('STAFF');
  const [departmentId, setDepartmentId] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    register({
      email,
      password,
      fullName,
      role,
      departmentId: departmentId || undefined,
    });
  };

  return (
    <div className="page page-register">
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">Register User</h1>
          <p className="auth-subtitle">Create a new account (HR only)</p>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          {submitted && !isRegisterPending && !error && (
            <div className="auth-success" role="status">
              User registered successfully
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="fullName" className="form-label">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
                autoComplete="name"
                disabled={isRegisterPending}
              />
            </div>

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
                disabled={isRegisterPending}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                autoComplete="new-password"
                disabled={isRegisterPending}
              />
            </div>

            <div className="form-group">
              <label htmlFor="role" className="form-label">
                Role
              </label>
              <select
                id="role"
                name="role"
                className="form-input"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                disabled={isRegisterPending}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="departmentId" className="form-label">
                Department ID (optional)
              </label>
              <input
                type="text"
                id="departmentId"
                name="departmentId"
                className="form-input"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                placeholder="dept-1"
                disabled={isRegisterPending}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={isRegisterPending || !email || !password || !fullName}
            >
              {isRegisterPending ? 'Registering...' : 'Register'}
            </button>
          </form>

          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={() => navigate('/users')}
            style={{ marginTop: '1rem' }}
          >
            Back to Users
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;
