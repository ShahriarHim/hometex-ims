import { useState } from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '../../../shared/components/PageHeader';
import { SkeletonTable } from '../../../shared/components/Skeleton';
import Pagination from '../../../shared/components/Pagination';
import { formatDateTime } from '../../../shared/utils/formatters';
import { useStaffActivity, useActivityLogActions } from '../api';
import { useAuth } from '../../../shared/hooks/useAuth';

const ACTION_COLORS = {
  created:   '#16a34a',
  updated:   '#2563eb',
  deleted:   '#dc2626',
  restored:  '#d97706',
  approved:  '#7c3aed',
  cancelled: '#6b7280',
  adjusted:  '#0891b2',
  transfer:  '#0891b2',
};

function actionBadge(action) {
  const color = Object.entries(ACTION_COLORS).find(([k]) => action?.toLowerCase().includes(k))?.[1] ?? '#374151';
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      fontSize: '0.7rem', fontWeight: 600, background: color + '18', color,
    }}>
      {action}
    </span>
  );
}

export default function StaffActivityPage() {
  const { id } = useParams();
  const { isAdmin, user } = useAuth();
  const isOwnActivity = String(user?.id) === String(id);

  const [page, setPage]     = useState(1);
  const [action, setAction] = useState('');
  const [from, setFrom]     = useState('');
  const [to, setTo]         = useState('');

  const params = { page, ...(action && { action }), ...(from && { from }), ...(to && { to }) };
  const { data, isLoading }   = useStaffActivity(id, params);
  const { data: actionsData } = useActivityLogActions();

  const logs    = data?.data ?? [];
  const meta    = data?.meta ?? {};
  const actions = actionsData?.data ?? actionsData ?? [];

  if (!isAdmin && !isOwnActivity) return (
    <div className="text-center py-5 text-muted">
      <i className="fa-solid fa-lock fa-2x mb-2 d-block opacity-25" />
      You can only view your own activity log.
    </div>
  );

  const clearFilters = () => { setAction(''); setFrom(''); setTo(''); setPage(1); };
  const hasFilters   = action || from || to;

  return (
    <div>
      <PageHeader
        title={isOwnActivity ? 'My Activity' : `Activity — Staff #${id}`}
        breadcrumb={[
          { label: 'Home', to: '/' },
          ...(isAdmin ? [{ label: 'Staff & Activity', to: '/activity-logs' }] : []),
          { label: isOwnActivity ? 'My Activity' : `Staff #${id}` },
        ]}
        actionLabel={isAdmin ? 'Back to Staff' : undefined}
        actionTo={isAdmin ? '/activity-logs' : undefined}
        actionIcon={isAdmin ? 'fa-arrow-left' : undefined}
      />

      <div className="card mb-3">
        <div className="card-body py-3">
          <div className="row g-2 align-items-end">
            <div className="col-sm-6 col-md-3">
              <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: 4 }}>Action</label>
              <select
                className="form-select form-select-sm"
                value={action}
                onChange={(e) => { setAction(e.target.value); setPage(1); }}
              >
                <option value="">All actions</option>
                {actions.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div className="col-sm-6 col-md-2">
              <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: 4 }}>From</label>
              <input
                className="form-control form-control-sm"
                type="date"
                value={from}
                onChange={(e) => { setFrom(e.target.value); setPage(1); }}
              />
            </div>
            <div className="col-sm-6 col-md-2">
              <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: 4 }}>To</label>
              <input
                className="form-control form-control-sm"
                type="date"
                value={to}
                onChange={(e) => { setTo(e.target.value); setPage(1); }}
              />
            </div>
            {hasFilters && (
              <div className="col-auto">
                <button className="btn btn-outline-secondary btn-sm" onClick={clearFilters}>
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="p-3"><SkeletonTable rows={10} cols={4} /></div>
          ) : logs.length === 0 ? (
            <div className="text-center py-5 text-muted" style={{ fontSize: '0.875rem' }}>
              No activity records found{hasFilters ? ' for the selected filters' : ''}.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0" style={{ fontSize: '0.82rem' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                  <tr>
                    <th style={{ padding: '10px 16px', fontWeight: 600, color: '#374151' }}>When</th>
                    <th style={{ padding: '10px 16px', fontWeight: 600, color: '#374151' }}>Action</th>
                    <th style={{ padding: '10px 16px', fontWeight: 600, color: '#374151' }}>Description</th>
                    <th style={{ padding: '10px 16px', fontWeight: 600, color: '#374151' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ padding: '10px 16px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                        {formatDateTime(log.created_at)}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        {actionBadge(log.action)}
                      </td>
                      <td style={{ padding: '10px 16px', color: '#374151' }}>
                        {log.description ?? '—'}
                      </td>
                      <td style={{ padding: '10px 16px', color: '#6b7280', fontSize: '0.75rem' }}>
                        {log.properties && Object.keys(log.properties).length > 0
                          ? Object.entries(log.properties)
                              .filter(([k]) => k !== 'updated_fields')
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(', ')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {meta.last_page > 1 && (
        <div className="mt-3">
          <Pagination
            currentPage={meta.current_page}
            totalItems={meta.total}
            perPage={meta.per_page}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
