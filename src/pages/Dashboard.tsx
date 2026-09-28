import { useUserLeaves } from '../hooks/useLeave';
import { useRequireAuth } from '../hooks/useAuth';
import type { LeaveStatus, LeaveRequest } from '../types/index';

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className="stat-card" style={{ '--stat-color': color } as React.CSSProperties}>
      <div className="stat-icon" aria-hidden="true">{icon}</div>
      <div className="stat-content">
        <p className="stat-value">{value}</p>
        <p className="stat-label">{title}</p>
      </div>
    </div>
  );
}

function RecentLeaveRow({ leave }: { leave: LeaveRequest }) {
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
    </tr>
  );
}

export function Dashboard() {
  const user = useRequireAuth();
  const { data: userLeaves, isLoading: leavesLoading } = useUserLeaves(user?.id || '');

  if (!user) return null;

  const leaves = userLeaves || [];
  const stats = {
    pending: leaves.filter(l => l.status === 'PENDING').length,
    approved: leaves.filter(l => l.status === 'APPROVED').length,
    rejected: leaves.filter(l => l.status === 'REJECTED').length,
    total: leaves.length,
  };

  const recentLeaves = leaves.slice(0, 5);

  return (
    <div className="page page-dashboard">
      <section className="dashboard-section" aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="section-title">Overview</h2>
        <div className="stats-grid" role="list" aria-label="Leave statistics">
          <StatCard title="Pending" value={stats.pending} icon="⏳" color="#f59e0b" />
          <StatCard title="Approved" value={stats.approved} icon="✅" color="#10b981" />
          <StatCard title="Rejected" value={stats.rejected} icon="❌" color="#ef4444" />
          <StatCard title="Total Requests" value={stats.total} icon="📋" color="#3b82f6" />
        </div>
      </section>

      <section className="dashboard-section" aria-labelledby="recent-heading">
        <div className="section-header">
          <h2 id="recent-heading" className="section-title">Recent Leave Requests</h2>
        </div>
        {leavesLoading ? (
          <div className="loading-container" role="status" aria-label="Loading leave requests">
            <div className="spinner" aria-hidden="true"></div>
          </div>
        ) : recentLeaves.length === 0 ? (
          <div className="empty-state">
            <p>No leave requests yet. <a href="/leave/request">Submit your first request</a></p>
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
                </tr>
              </thead>
              <tbody>
                {recentLeaves.map(leave => (
                  <RecentLeaveRow key={leave.id} leave={leave} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Manager/HR specific section - pending approvals */}
      {user.role === 'MANAGER' || user.role === 'HR' ? (
        <section className="dashboard-section" aria-labelledby="pending-approval-heading">
          <h2 id="pending-approval-heading" className="section-title">Pending Approvals</h2>
          <p className="section-description">View and approve leave requests in <a href="/leave/approval">Leave Approval</a></p>
        </section>
      ) : null}
    </div>
  );
}

export default Dashboard;