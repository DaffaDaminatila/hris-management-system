import { useState } from 'react';
import { useCreateLeave, useUserLeaves, useLeaveBalance } from '../hooks/useLeave';
import { useRequireAuth } from '../hooks/useAuth';
import { calculateLeaveDays } from '../services/mockDb';
import type { LeaveType, LeaveStatus, CreateLeaveData, LeaveRequest as LeaveRequestType } from '../types/index';

const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: 'ANNUAL', label: 'Annual Leave' },
  { value: 'SICK', label: 'Sick Leave' },
  { value: 'PERSONAL', label: 'Personal Leave' },
  { value: 'OTHER', label: 'Other' },
];

function LeaveRow({ leave, onCancel }: { leave: LeaveRequestType; onCancel: (_id: string) => void }) {
  const getStatusClass = (status: LeaveStatus) => {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      case 'CANCELLED': return 'status-cancelled';
      default: return '';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <tr>
      <td>{leave.type}</td>
      <td>{formatDate(leave.startDate)} - {formatDate(leave.endDate)}</td>
      <td><span className={`status-badge ${getStatusClass(leave.status)}`}>{leave.status}</span></td>
      <td>{leave.reason}</td>
      <td>
        {leave.status === 'PENDING' && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onCancel(leave.id)}
            aria-label={`Cancel leave request ${leave.id}`}
          >
            Cancel
          </button>
        )}
      </td>
    </tr>
  );
}

function QuotaCard({ balance }: { balance: { type: string; entitlement: number; used: number; remaining: number; percentage: number } }) {
  const getColorClass = (percentage: number) => {
    if (percentage >= 90) return 'quota-danger';
    if (percentage >= 70) return 'quota-warning';
    return 'quota-normal';
  };

  const labelMap: Record<string, string> = {
    ANNUAL: 'Annual',
    SICK: 'Sick',
    PERSONAL: 'Personal',
  };

  return (
    <div className="quota-card">
      <div className="quota-header">
        <span className="quota-type">{labelMap[balance.type] || balance.type}</span>
        <span className="quota-remaining">{balance.remaining} / {balance.entitlement} days</span>
      </div>
      <div className="quota-bar">
        <div 
          className={`quota-fill ${getColorClass(balance.percentage)}`}
          style={{ width: `${Math.min(balance.percentage, 100)}%` }}
        />
      </div>
      <div className="quota-percentage">{balance.percentage}% used</div>
    </div>
  );
}

export function LeaveRequest() {
  const user = useRequireAuth();
  const { data: userLeaves, isLoading, refetch } = useUserLeaves(user?.id || '');
  const { data: balance, isLoading: balanceLoading } = useLeaveBalance(user?.id || '');
  const createLeave = useCreateLeave();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateLeaveData>({
    type: 'ANNUAL',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!formData.startDate || !formData.endDate || !formData.reason) {
      setError('All fields are required');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setError('Start date must be before end date');
      return;
    }

    if (new Date(formData.startDate) < new Date(new Date().setHours(0, 0, 0, 0))) {
      setError('Start date cannot be in the past');
      return;
    }

    createLeave.mutate(
      { data: formData, userId: user.id },
      {
        onSuccess: () => {
          setSuccess(true);
          setFormData({ type: 'ANNUAL', startDate: '', endDate: '', reason: '' });
          setShowForm(false);
          refetch();
        },
        onError: (err: Error) => {
          setError(err.message);
        },
      }
    );
  };

  const handleCancel = (_id: string) => {
    if (confirm('Are you sure you want to cancel this leave request?')) {
      refetch();
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const leaves = userLeaves || [];

  // Calculate requested days when dates change
  const requestedDays = formData.startDate && formData.endDate 
    ? calculateLeaveDays(formData.startDate, formData.endDate) 
    : 0;

  // Check quota for selected type
  const selectedBalance = balance?.find(b => b.type === formData.type);
  const quotaExceeded = formData.type !== 'OTHER' && selectedBalance 
    ? selectedBalance.remaining < requestedDays 
    : false;

  return (
    <div className="page page-leave-request">
      {/* Leave Balance Overview */}
      <section className="page-section" aria-labelledby="balance-heading">
        <h2 id="balance-heading" className="section-title">Your Leave Balance</h2>
        {balanceLoading ? (
          <div className="loading-container" role="status" aria-label="Loading leave balance">
            <div className="spinner" aria-hidden="true"></div>
          </div>
        ) : balance && balance.length > 0 ? (
          <div className="quota-grid" role="list" aria-label="Leave quotas">
            {balance.map(b => (
              <QuotaCard key={b.type} balance={b} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No leave balance data available.</p>
          </div>
        )}
      </section>

      <section className="page-section" aria-labelledby="create-heading">
        <div className="section-header">
          <h2 id="create-heading" className="section-title">Submit Leave Request</h2>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
            aria-expanded={showForm}
            aria-controls="leave-form"
          >
            {showForm ? 'Hide Form' : 'New Request'}
          </button>
        </div>

        {showForm && (
          <form id="leave-form" onSubmit={handleSubmit} className="leave-form" noValidate>
            {error && <div className="form-error" role="alert">{error}</div>}
            {success && <div className="form-success" role="status">Leave request submitted successfully</div>}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="type" className="form-label">Leave Type</label>
                <select
                  id="type"
                  className="form-select"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as LeaveType })}
                  disabled={createLeave.isPending}
                >
                  {LEAVE_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                {formData.type !== 'OTHER' && selectedBalance && (
                  <span className="form-hint">
                    Remaining: {selectedBalance.remaining} day(s) of {selectedBalance.entitlement}
                    {requestedDays > 0 && ` • Requested: ${requestedDays} day(s)`}
                  </span>
                )}
                {quotaExceeded && (
                  <div className="form-error" style={{marginTop: '0.5rem'}}>
                    Insufficient quota! You have {selectedBalance?.remaining} day(s) remaining but requested {requestedDays} day(s).
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="startDate" className="form-label">Start Date</label>
                <input
                  type="date"
                  id="startDate"
                  className="form-input"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  min={today}
                  required
                  disabled={createLeave.isPending}
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate" className="form-label">End Date</label>
                <input
                  type="date"
                  id="endDate"
                  className="form-input"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={formData.startDate || today}
                  required
                  disabled={createLeave.isPending}
                />
              </div>
            </div>

            {requestedDays > 0 && (
              <div className="form-hint" style={{ marginTop: '-0.5rem', marginBottom: '1rem' }}>
                <strong>{requestedDays}</strong> working day(s) requested (weekends excluded)
              </div>
            )}

            <div className="form-group">
              <label htmlFor="reason" className="form-label">Reason</label>
              <textarea
                id="reason"
                className="form-input form-textarea"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Brief reason for leave..."
                required
                rows={3}
                disabled={createLeave.isPending}
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createLeave.isPending || quotaExceeded}
              >
                {createLeave.isPending ? 'Submitting...' : 'Submit Request'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowForm(false)}
                disabled={createLeave.isPending}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="page-section" aria-labelledby="history-heading">
        <h2 id="history-heading" className="section-title">Your Leave History</h2>

        {isLoading ? (
          <div className="loading-container" role="status" aria-label="Loading leave history">
            <div className="spinner" aria-hidden="true"></div>
          </div>
        ) : leaves.length === 0 ? (
          <div className="empty-state">
            <p>No leave requests yet. Click "New Request" to submit one.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table" role="table">
              <thead>
                <tr>
                  <th scope="col">Type</th>
                  <th scope="col">Dates</th>
                  <th scope="col">Status</th>
                  <th scope="col">Reason</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map(leave => (
                  <LeaveRow key={leave.id} leave={leave} onCancel={handleCancel} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default LeaveRequest;