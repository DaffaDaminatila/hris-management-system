import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { Role } from '../../types/index';

interface RegisterFormProps {
  onSuccess?: () => void;
}

const DEPARTMENTS = [
  { id: 'dept-1', name: 'Engineering' },
  { id: 'dept-2', name: 'Product' },
  { id: 'dept-3', name: 'Design' },
  { id: 'dept-4', name: 'HR' },
  { id: 'dept-5', name: 'Finance' },
];

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'STAFF', label: 'Staff' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'HR', label: 'HR Admin' },
];

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const navigate = useNavigate();
  const { register, isRegisterPending, error, user } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STAFF' as Role,
    departmentId: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Redirect if already authenticated (only HR can access register)
  if (user && user.role !== 'HR') {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Full name must be at least 2 characters';
        break;
      case 'email':
        if (!value) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
        break;
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
        if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter';
        if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
        break;
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== formData.password) return 'Passwords do not match';
        break;
      case 'role':
        if (!value) return 'Role is required';
        break;
      case 'departmentId':
        if (value && formData.role === 'HR') return 'HR does not need a department';
        break;
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear field error on change
    const fieldError = validateField(name, value);
    setFieldErrors(prev => ({ ...prev, [name]: fieldError }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const errors: Record<string, string> = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) errors[key] = error;
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Prepare data for registration
    const registerData = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      role: formData.role,
      departmentId: formData.departmentId || undefined,
    };

    register(registerData);
    if (onSuccess) onSuccess();
  };

  // Check if HR role - they don't need department
  const showDepartment = formData.role !== 'HR';

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Register a new staff or manager account (HR only)</p>

        {error && (
          <div className="auth-error" role="alert">
            {error}
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
              className={`form-input ${fieldErrors.fullName ? 'error' : ''}`}
              value={formData.fullName}
              onChange={handleChange}
              placeholder="John Doe"
              required
              autoComplete="name"
              disabled={isRegisterPending}
              aria-describedby={fieldErrors.fullName ? 'fullName-error' : 'fullName-hint'}
            />
            {fieldErrors.fullName && (
              <span id="fullName-error" className="form-error" role="alert">
                {fieldErrors.fullName}
              </span>
            )}
            {!fieldErrors.fullName && (
              <span id="fullName-hint" className="form-hint">
                Enter the employee's full name
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className={`form-input ${fieldErrors.email ? 'error' : ''}`}
              value={formData.email}
              onChange={handleChange}
              placeholder="john@company.com"
              required
              autoComplete="email"
              disabled={isRegisterPending}
              aria-describedby={fieldErrors.email ? 'email-error' : 'email-hint'}
            />
            {fieldErrors.email && (
              <span id="email-error" className="form-error" role="alert">
                {fieldErrors.email}
              </span>
            )}
            {!fieldErrors.email && (
              <span id="email-hint" className="form-hint">
                Use company email address
              </span>
            )}
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
                className={`form-input ${fieldErrors.password ? 'error' : ''}`}
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                required
                autoComplete="new-password"
                disabled={isRegisterPending}
                aria-describedby={fieldErrors.password ? 'password-error' : 'password-hint'}
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
            {fieldErrors.password && (
              <span id="password-error" className="form-error" role="alert">
                {fieldErrors.password}
              </span>
            )}
            {!fieldErrors.password && (
              <span id="password-hint" className="form-hint">
                Min 8 chars, uppercase, lowercase, number
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              className={`form-input ${fieldErrors.confirmPassword ? 'error' : ''}`}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
              autoComplete="new-password"
              disabled={isRegisterPending}
              aria-describedby={fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined}
            />
            {fieldErrors.confirmPassword && (
              <span id="confirmPassword-error" className="form-error" role="alert">
                {fieldErrors.confirmPassword}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="role" className="form-label">
              Role
            </label>
            <select
              id="role"
              name="role"
              className={`form-select ${fieldErrors.role ? 'error' : ''}`}
              value={formData.role}
              onChange={handleChange}
              required
              disabled={isRegisterPending}
              aria-describedby={fieldErrors.role ? 'role-error' : 'role-hint'}
            >
              {ROLE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {fieldErrors.role && (
              <span id="role-error" className="form-error" role="alert">
                {fieldErrors.role}
              </span>
            )}
            {!fieldErrors.role && (
              <span id="role-hint" className="form-hint">
                HR can create Staff and Manager accounts
              </span>
            )}
          </div>

          {showDepartment && (
            <div className="form-group">
              <label htmlFor="departmentId" className="form-label">
                Department (Optional)
              </label>
              <select
                id="departmentId"
                name="departmentId"
                className={`form-select ${fieldErrors.departmentId ? 'error' : ''}`}
                value={formData.departmentId}
                onChange={handleChange}
                disabled={isRegisterPending}
                aria-describedby={fieldErrors.departmentId ? 'departmentId-error' : 'departmentId-hint'}
              >
                <option value="">Select department...</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {fieldErrors.departmentId && (
                <span id="departmentId-error" className="form-error" role="alert">
                  {fieldErrors.departmentId}
                </span>
              )}
              {!fieldErrors.departmentId && (
                <span id="departmentId-hint" className="form-hint">
                  Assign to a department (optional)
              </span>
              )}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isRegisterPending || Object.values(formData).some(v => !v && v !== '')}
          >
            {isRegisterPending ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <a href="/login">Sign in</a></p>
        </div>
      </div>
    </div>
  );
}