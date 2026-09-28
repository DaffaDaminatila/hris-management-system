import { useLeaves, useApproveLeave } from '../hooks/useLeave';
import { useRequireAuth } from '../hooks/useAuth';
import { useAuthStore } from '../store/authStore';

interface PendingLeaveRowProps {
  leave: any;
  onApprove: (id: string, status: 'APPROVED' | 'REJECTED') => void;
  isPending: boolean;
}

function PendingLeaveRow({ leave, onApprove, isPending }: PendingLeaveRowProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <tr>
      <td>{leave.userId}</td>
      <td>{leave.type}</td>
      <td>{formatDate(leave.startDate)} - {formatDate(leave.endDate)}</td>
      <td>{leave.reason}</td>
      <td>{new Date(leave.createdAt).toLocaleDateString()}</td>
      <td>
        <div className="approval-actions">
          <button
            className="btn btn-success btn-sm"
            onClick={() => onApprove(leave.id, 'APPROVED')}
            disabled={isPending}
            aria-label={`Approve leave request for user ${leave.userId}`}
          >
            Approve
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => onApprove(leave.id, 'REJECTED')}
            disabled={isPending}
            aria-label={`Reject leave request for user ${leave.userId}`}
          >
            Reject
          </button>
        </div>
      </td>
    </tr>
  );
}

export function LeaveApproval() {
  const user = useRequireAuth();
  const accessToken = useAuthStore(state => state.accessToken);
  const { data: pendingLeaves, isLoading, refetch } = useLeaves({ status: 'PENDING' });
  const approveLeave = useApproveLeave();

  if (!user || (user.role !== 'MANAGER' && user.role !== 'HR')) {
    return null;
  }

  const handleApprove = (id: string, status: 'APPROVED' | 'REJECTED') => {
    if (!accessToken) return;

    // Decode token to get user ID
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    const approverId = payload.sub;

    approveLeave.mutate(
      { id, approverId, status },
      {
        onSuccess: () => {
          refetch();
        },
        onError: (err: Error) => {
          alert(err.message);
        },
      }
    );
  };

  return (
    <div className="page page-leave-approval">
      <section className="page-section" aria-labelledby="approval-heading">
        <h2 id="approval-heading" className="section-title">Pending Leave Approvals</h2>
        <p className="section-description">Review and approve or reject pending leave requests</p>
      </section>

      <section className="page-section" aria-labelledby="pending-list-heading">
        <h2 id="pending-list-heading" className="visually-hidden">Pending Requests</h2>

        {isLoading ? (
          <div className="loading-container" role="status" aria-label="Loading pending requests">
            <div className="spinner" aria-hidden="true"></div>
          </div>
        ) : pendingLeaves?.data.length === 0 ? (
          <div className="empty-state">
            <p>No pending leave requests to review.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table" role="table">
              <thead>
                <tr>
                  <th scope="col">Employee</th>
                  <th scope="col">Leave Type</th>
                  <th scope="col">Dates</th>
                  <th scope="col">Reason</th>
                  <th scope="col">Submitted</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingLeaves?.data.map(leave => (
                  <PendingLeaveRow
                    key={leave.id}
                    leave={leave}
                    onApprove={handleApprove}
                    isPending={approveLeave.isPending}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default LeaveApproval;