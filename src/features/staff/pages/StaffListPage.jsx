import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import PageHeader from '../../../shared/components/PageHeader';
import DataTable from '../../../shared/components/DataTable';
import ConfirmDialog from '../../../shared/components/ConfirmDialog';
import { useTableParams } from '../../../shared/hooks/useTableParams';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { formatDate } from '../../../shared/utils/formatters';
import { staffApi } from '../api';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useStaffRoles } from '../../activity-logs/api';

const toast = (icon, title) =>
  Swal.fire({ toast: true, position: 'top-end', icon, title, timer: 1400, showConfirmButton: false });

const ROLE_COLORS = {
  admin:           'bg-danger',
  manager:         'bg-primary',
  product_manager: 'bg-info text-dark',
  sales_staff:     'bg-success',
  warehouse:       'bg-secondary',
};

export default function StaffListPage() {
  const { isAdmin, hasPermission } = useAuth();
  const canCreate = isAdmin || hasPermission('staff.create');
  const canEdit   = isAdmin || hasPermission('staff.edit');
  const canDelete = isAdmin || hasPermission('staff.delete');

  const [searchInput, setSearchInput]   = useState('');
  const [roleFilter, setRoleFilter]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const qc = useQueryClient();

  const debouncedSearch = useDebounce(searchInput, 400);
  const { params, setPage, setPerPage } = useTableParams({ orderBy: 'id', direction: 'desc', perPage: 15 });

  const queryParams = {
    ...params,
    search: debouncedSearch || undefined,
    role:   roleFilter || undefined,
    status: statusFilter || undefined,
  };

  const { data, isLoading }    = useQuery({
    queryKey: ['staff', queryParams],
    queryFn: () => staffApi.list(queryParams),
  });
  const { data: rolesData }    = useStaffRoles();
  const roles                  = rolesData ?? [];

  const { mutate: destroy, isPending: deleting } = useMutation({
    mutationFn: (id) => staffApi.remove(id),
    onSuccess: (res) => {
      toast('success', res?.message ?? 'Staff member removed');
      qc.invalidateQueries({ queryKey: ['staff'] });
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast('error', err?.response?.data?.message ?? 'Failed to remove staff member');
      setDeleteTarget(null);
    },
  });

  const rows = data?.data ?? (Array.isArray(data) ? data : []);
  const meta = data?.meta ?? null;

  const clearFilters = () => { setSearchInput(''); setRoleFilter(''); setStatusFilter(''); };
  const hasFilters   = searchInput || roleFilter || statusFilter;

  const columns = [
    {
      label: 'Staff Member',
      render: (row) => (
        <div className="d-flex align-items-center gap-2">
          <div
            className="bg-primary d-flex align-items-center justify-content-center text-white"
            style={{ width: 34, height: 34, borderRadius: '50%', fontSize: 13, flexShrink: 0 }}
          >
            {(row.first_name ?? row.name ?? '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="fw-semibold">{row.name ?? `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim()}</div>
            <small className="text-muted">{row.email}</small>
          </div>
        </div>
      ),
    },
    { label: 'Phone', render: (row) => row.phone ?? '—' },
    {
      label: 'Role',
      render: (row) => {
        const roles = row.roles ?? [];
        return roles.length ? (
          <div className="d-flex gap-1 flex-wrap">
            {roles.map((r) => (
              <span key={r} className={`badge text-capitalize ${ROLE_COLORS[r] ?? 'bg-light text-dark border'}`} style={{ fontSize: '0.72rem' }}>
                {r.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        ) : <span className="text-muted small">No role</span>;
      },
    },
    { label: 'Branch', render: (row) => row.shop?.name ?? row.branch?.name ?? '—' },
    {
      label: 'Status',
      className: 'text-center',
      render: (row) => {
        const active = row.status === 'active' || Number(row.status) === 1;
        return <span className={`badge ${active ? 'bg-success' : 'bg-secondary'}`}>{active ? 'Active' : 'Inactive'}</span>;
      },
    },
    {
      label: 'Added',
      render: (row) => <small className="text-muted">{formatDate(row.created_at)}</small>,
    },
    {
      label: 'Actions',
      className: 'text-center',
      render: (row) => (
        <div className="d-flex gap-1 justify-content-center">
          {canEdit && (
            <Link to={`/staff/edit/${row.id}`} className="btn btn-sm btn-outline-primary btn-icon" title="Edit">
              <i className="fa-solid fa-pen" />
            </Link>
          )}
          {isAdmin && (
            <Link to={`/activity-logs/${row.id}`} className="btn btn-sm btn-outline-secondary btn-icon" title="Activity">
              <i className="fa-solid fa-list-ul" />
            </Link>
          )}
          {canDelete && (
            <button className="btn btn-sm btn-outline-danger btn-icon" title="Remove" onClick={() => setDeleteTarget(row)}>
              <i className="fa-solid fa-trash" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Staff Management"
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Staff' }]}
        actionLabel={canCreate ? 'Add Staff' : undefined}
        actionTo={canCreate ? '/staff/create' : undefined}
        actionIcon="fa-plus"
      />

      <div className="card">
        <div className="card-body">
          <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
            <div className="input-group input-group-sm" style={{ maxWidth: 260 }}>
              <span className="input-group-text"><i className="fa-solid fa-magnifying-glass" /></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search name or email…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            <select
              className="form-select form-select-sm"
              style={{ maxWidth: 160 }}
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            >
              <option value="">All roles</option>
              {roles.map((r) => (
                <option key={r.id ?? r.name} value={r.name}>
                  {r.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>

            <select
              className="form-select form-select-sm"
              style={{ maxWidth: 130 }}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {hasFilters && (
              <button className="btn btn-outline-secondary btn-sm" onClick={clearFilters}>Clear</button>
            )}

            <div className="ms-auto d-flex align-items-center gap-2">
              <label className="text-muted small mb-0">Show</label>
              <select
                className="form-select form-select-sm"
                style={{ width: 70 }}
                value={params.per_page}
                onChange={(e) => setPerPage(Number(e.target.value))}
              >
                {[10, 15, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={rows}
            isLoading={isLoading}
            meta={meta}
            onPageChange={setPage}
            emptyText="No staff members found."
          />
        </div>
      </div>

      <ConfirmDialog
        show={Boolean(deleteTarget)}
        title="Remove Staff Member?"
        message={`Remove "${deleteTarget?.name ?? deleteTarget?.email}"? Their account will be deactivated.`}
        confirmLabel="Remove"
        variant="danger"
        isLoading={deleting}
        onConfirm={() => destroy(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
