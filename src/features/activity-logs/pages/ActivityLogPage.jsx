import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../../shared/components/PageHeader';
import { SkeletonTable } from '../../../shared/components/Skeleton';
import { formatDateTime } from '../../../shared/utils/formatters';
import { useActivityLogStaff, useStaffRoles } from '../api';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useDebounce } from '../../../shared/hooks/useDebounce';

function RoleBadge({ role }) {
  const colors = {
    admin:           'bg-danger',
    manager:         'bg-primary',
    product_manager: 'bg-info text-dark',
    sales_staff:     'bg-success',
    warehouse:       'bg-secondary',
  };
  return (
    <span className={`badge ${colors[role] ?? 'bg-light text-dark border'} text-capitalize`} style={{ fontSize: '0.72rem' }}>
      {role.replace(/_/g, ' ')}
    </span>
  );
}

export default function ActivityLogPage() {
  const { isAdmin } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [role, setRole]               = useState('');

  const search = useDebounce(searchInput, 350);

  const { data, isLoading }      = useActivityLogStaff({ ...(search && { search }), ...(role && { role }) });
  const { data: rolesData }      = useStaffRoles();
  const staff  = data?.data ?? [];
  const roles  = rolesData ?? [];

  if (!isAdmin) return (
    <div className="text-center py-5 text-muted">
      <i className="fa-solid fa-lock fa-2x mb-2 d-block opacity-25" />
      Activity logs are restricted to administrators.
    </div>
  );

  const clearFilters = () => { setSearchInput(''); setRole(''); };
  const hasFilters   = searchInput || role;

  return (
    <div>
      <PageHeader
        title="Staff & Activity"
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Staff & Activity' }]}
        actionLabel="Add Staff"
        actionTo="/staff/create"
        actionIcon="fa-plus"
      />

      <div className="card mb-3">
        <div className="card-body py-3">
          <div className="row g-2 align-items-end">
            <div className="col-sm-6 col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text"><i className="fa-solid fa-magnifying-glass" /></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search name or email…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
            </div>
            <div className="col-sm-4 col-md-2">
              <select
                className="form-select form-select-sm"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="">All roles</option>
                {roles.map((r) => (
                  <option key={r.id ?? r.name} value={r.name}>
                    {r.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            {hasFilters && (
              <div className="col-auto">
                <button className="btn btn-outline-secondary btn-sm" onClick={clearFilters}>Clear</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="p-3"><SkeletonTable rows={8} cols={5} /></div>
          ) : staff.length === 0 ? (
            <div className="text-center py-5 text-muted" style={{ fontSize: '0.875rem' }}>
              No staff found{hasFilters ? ' matching your filters' : ''}.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0" style={{ fontSize: '0.83rem' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                  <tr>
                    <th style={{ padding: '10px 16px', fontWeight: 600, color: '#374151' }}>Staff Member</th>
                    <th style={{ padding: '10px 16px', fontWeight: 600, color: '#374151' }}>Role</th>
                    <th style={{ padding: '10px 16px', fontWeight: 600, color: '#374151' }}>Status</th>
                    <th style={{ padding: '10px 16px', fontWeight: 600, color: '#374151' }}>Last Activity</th>
                    <th style={{ padding: '10px 16px', fontWeight: 600, color: '#374151', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((u) => (
                    <tr key={u.id}>
                      <td style={{ padding: '10px 16px' }}>
                        <div className="fw-semibold" style={{ color: '#111827' }}>{u.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{u.email}</div>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <div className="d-flex flex-wrap gap-1">
                          {(u.roles ?? []).map((r) => <RoleBadge key={r} role={r} />)}
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span className={`badge ${u.status === 'active' || u.status === 1 ? 'bg-success' : 'bg-secondary'}`}>
                          {u.status === 'active' || u.status === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', color: '#6b7280' }}>
                        {u.last_active_at ? formatDateTime(u.last_active_at) : <span className="text-muted">Never</span>}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <div className="d-flex gap-1 justify-content-center">
                          <Link
                            to={`/staff/edit/${u.id}`}
                            className="btn btn-sm btn-outline-primary py-0 px-2"
                            title="Edit profile"
                          >
                            <i className="fa-solid fa-pen me-1" style={{ fontSize: '0.72rem' }} />Edit
                          </Link>
                          <Link
                            to={`/activity-logs/${u.id}`}
                            className="btn btn-sm btn-outline-secondary py-0 px-2"
                            title="View activity"
                          >
                            <i className="fa-solid fa-list-ul me-1" style={{ fontSize: '0.72rem' }} />Activity
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
