import { useState, useEffect } from 'react';
import { useRequireAuth } from '../hooks/useAuth';
import { mockDb } from '../services/mockDb';
import type { Department } from '../types/index';

export function Settings() {
  const user = useRequireAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', managerId: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!user) return null;

  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      const depts = await mockDb.getAllDepartments();
      setDepartments(depts);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      setIsLoading(true);
      try {
        const depts = await mockDb.getAllDepartments();
        setDepartments(depts);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load departments');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!formData.name) {
      setError('Department name is required');
      return;
    }

    try {
      await mockDb.createDepartment({
        name: formData.name,
        managerId: formData.managerId || null,
      });
      setSuccess(true);
      setFormData({ name: '', managerId: '' });
      setShowForm(false);
      fetchDepartments();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="page page-settings">
      <section className="page-section" aria-labelledby="departments-heading">
        <div className="section-header">
          <h2 id="departments-heading" className="section-title">Department Management</h2>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
            aria-expanded={showForm}
            aria-controls="dept-form"
          >
            {showForm ? 'Hide Form' : '+ New Department'}
          </button>
        </div>
        <p className="section-description">Manage company departments. Only HR can access this page.</p>
      </section>

      {showForm && (
        <section className="page-section" aria-labelledby="create-dept-heading">
          <h2 id="create-dept-heading" className="section-title">Create Department</h2>
          <form id="dept-form" onSubmit={handleSubmit} className="dept-form" noValidate>
            {error && <div className="form-error" role="alert">{error}</div>}
            {success && <div className="form-success" role="status">Department created successfully</div>}

            <div className="form-group">
              <label htmlFor="name" className="form-label">Department Name</label>
              <input
                type="text"
                id="name"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Engineering"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="managerId" className="form-label">Manager ID (optional)</label>
              <input
                type="text"
                id="managerId"
                className="form-input"
                value={formData.managerId}
                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                placeholder="user-id"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Create</button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="page-section" aria-labelledby="dept-list-heading">
        <h2 id="dept-list-heading" className="visually-hidden">Departments</h2>

        {isLoading ? (
          <div className="loading-container" role="status" aria-label="Loading departments">
            <div className="spinner" aria-hidden="true"></div>
          </div>
        ) : departments.length === 0 ? (
          <div className="empty-state">
            <p>No departments yet. Click "+ New Department" to create one.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table" role="table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Manager ID</th>
                  <th scope="col">ID</th>
                </tr>
              </thead>
              <tbody>
                {departments.map(dept => (
                  <tr key={dept.id}>
                    <td>{dept.name}</td>
                    <td>{dept.managerId || '-'}</td>
                    <td><code>{dept.id}</code></td>
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

export default Settings;