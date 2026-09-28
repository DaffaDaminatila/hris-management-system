import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockDb } from '../services/mockDb';
import { useRequireAuth } from '../hooks/useAuth';
import type { Role, User } from '../types/index';

export function Users() {
  const user = useRequireAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const allUsers = await mockDb.getAllUsers();
        setUsers(allUsers);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (!user) return null;

  const getRoleBadgeClass = (role: Role) => {
    switch (role) {
      case 'HR': return 'role-hr';
      case 'MANAGER': return 'role-manager';
      case 'STAFF': return 'role-staff';
      default: return '';
    }
  };

  return (
    <div className="page page-users">
      <section className="page-section" aria-labelledby="users-heading">
        <div className="section-header">
          <h2 id="users-heading" className="section-title">User Management</h2>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/register')}
          >
            + New User
          </button>
        </div>
        <p className="section-description">View and manage all users. Only HR can access this page.</p>
      </section>

      <section className="page-section" aria-labelledby="user-list-heading">
        <h2 id="user-list-heading" className="visually-hidden">All Users</h2>

        {error && <div className="form-error" role="alert">{error}</div>}

        {isLoading ? (
          <div className="loading-container" role="status" aria-label="Loading users">
            <div className="spinner" aria-hidden="true"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <p>No users found.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table" role="table">
              <thead>
                <tr>
                  <th scope="col">Full Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Department</th>
                  <th scope="col">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td><span className={`role-badge ${getRoleBadgeClass(u.role)}`}>{u.role}</span></td>
                    <td>{u.departmentId || '-'}</td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Users;
