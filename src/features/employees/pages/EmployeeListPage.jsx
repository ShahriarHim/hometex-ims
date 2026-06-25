import { useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import PageHeader from '../../../shared/components/PageHeader';
import DataTable from '../../../shared/components/DataTable';
import ConfirmDialog from '../../../shared/components/ConfirmDialog';
import AppModal from '../../../shared/components/AppModal';
import { useTableParams } from '../../../shared/hooks/useTableParams';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { formatDate } from '../../../shared/utils/formatters';
import { useEmployees, useDeleteEmployee, EMPLOYEE_TYPES } from '../api';
import { useAuth } from '../../../shared/hooks/useAuth';

const toast = (icon, title) =>
  Swal.fire({ toast: true, position: 'top-end', icon, title, timer: 1400, showConfirmButton: false });

export default function EmployeeListPage() {
  const { hasPermission, isAdmin } = useAuth();
  const canCreate = isAdmin || hasPermission('staff.create');
  const canEdit   = isAdmin || hasPermission('staff.edit');
  const canDelete = isAdmin || hasPermission('staff.delete');

  const [searchInput, setSearchInput]   = useState('');
  const [typeFilter, setTypeFilter]     = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [photoUrl, setPhotoUrl]         = useState(null);

  const debouncedSearch = useDebounce(searchInput, 400);
  const { params, setPage, setPerPage } = useTableParams({ orderBy: 'id', direction: 'desc', perPage: 15 });

  const queryParams = { ...params, search: debouncedSearch, employee_type: typeFilter || undefined };
  const { data, isLoading } = useEmployees(queryParams);
  const { mutate: destroy, isPending: deleting } = useDeleteEmployee();

  const rows = data?.data ?? (Array.isArray(data) ? data : []);
  const meta = data?.meta ?? null;

  const handleDelete = () => {
    destroy(deleteTarget.id, {
      onSuccess: (res) => { toast('success', res?.message ?? 'Employee deleted'); setDeleteTarget(null); },
      onError:   (err) => { toast('error', err?.response?.data?.message ?? 'Failed to delete employee'); setDeleteTarget(null); },
    });
  };

  const columns = [
    {
      label: 'Employee',
      render: (row) => (
        <div className="d-flex align-items-center gap-2">
          {row.photo ? (
            <img
              src={row.photo}
              alt={row.name}
              style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: '50%', cursor: 'pointer', flexShrink: 0 }}
              onClick={() => setPhotoUrl(row.photo_full ?? row.photo)}
            />
          ) : (
            <div
              className="bg-secondary d-flex align-items-center justify-content-center text-white"
              style={{ width: 34, height: 34, borderRadius: '50%', fontSize: 13, flexShrink: 0 }}
            >
              {row.name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
          )}
          <div>
            <div className="fw-semibold">{row.name}</div>
            <small className="text-muted">{row.email}</small>
          </div>
        </div>
      ),
    },
    { label: 'Phone', render: (row) => row.phone ?? '—' },
    {
      label: 'Type',
      render: (row) => (
        <span className="badge bg-info text-dark">
          {EMPLOYEE_TYPES[row.employee_type] ?? `Type ${row.employee_type}`}
        </span>
      ),
    },
    { label: 'Branch', render: (row) => row.shop ?? row.shop_name ?? '—' },
    {
      label: 'Status',
      className: 'text-center',
      render: (row) => {
        const active = row.status === 'Active' || Number(row.status) === 1;
        return (
          <span className={`badge ${active ? 'bg-success' : 'bg-secondary'}`}>
            {active ? 'Active' : 'Inactive'}
          </span>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Added',
      render: (row) => <small className="text-muted">{formatDate(row.created_at)}</small>,
    },
    {
      label: 'Actions',
      className: 'text-center',
      render: (row) => (
        <div className="d-flex gap-1 justify-content-center">
          {canEdit && (
            <Link to={`/employee/edit/${row.id}`} className="btn btn-sm btn-outline-primary btn-icon" title="Edit">
              <i className="fa-solid fa-pen" />
            </Link>
          )}
          {canDelete && (
            <button className="btn btn-sm btn-outline-danger btn-icon" title="Delete" onClick={() => setDeleteTarget(row)}>
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
        title="Employees"
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Employees' }]}
        actionLabel={canCreate ? 'Add Employee' : undefined}
        actionTo={canCreate ? '/employee/create' : undefined}
        actionIcon="fa-plus"
      />

      <div className="card">
        <div className="card-body">
          <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
            <div className="d-flex gap-2 flex-wrap align-items-center">
              <div className="input-group" style={{ maxWidth: 260 }}>
                <span className="input-group-text"><i className="fa-solid fa-magnifying-glass" /></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name or phone…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <select
                className="form-select form-select-sm"
                style={{ width: 160 }}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                {Object.entries(EMPLOYEE_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="d-flex align-items-center gap-2">
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
            emptyText="No employees found."
          />
        </div>
      </div>

      <ConfirmDialog
        show={Boolean(deleteTarget)}
        title="Delete Employee?"
        message={`Remove "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <AppModal show={Boolean(photoUrl)} title="Photo" onHide={() => setPhotoUrl(null)} size="sm">
        {photoUrl && <img src={photoUrl} alt="employee" className="img-fluid rounded" />}
      </AppModal>
    </div>
  );
}
