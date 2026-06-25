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
import { useSuppliers, useDeleteSupplier } from '../api';
import { useAuth } from '../../../shared/hooks/useAuth';

const toast = (icon, title) =>
  Swal.fire({ toast: true, position: 'top-end', icon, title, timer: 1400, showConfirmButton: false });

export default function SupplierListPage() {
  const { hasPermission, isAdmin } = useAuth();
  const canCreate = isAdmin || hasPermission('suppliers.create');
  const canEdit   = isAdmin || hasPermission('suppliers.edit');
  const canDelete = isAdmin || hasPermission('suppliers.delete');

  const [searchInput, setSearchInput] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [lightboxUrl, setLightboxUrl]   = useState(null);

  const debouncedSearch = useDebounce(searchInput, 400);
  const { params, setPage, setPerPage, setSort } = useTableParams({ orderBy: 'id', direction: 'desc', perPage: 15 });
  const { data, isLoading } = useSuppliers({ ...params, search: debouncedSearch });
  const { mutate: destroy, isPending: deleting } = useDeleteSupplier();

  const rows = data?.data ?? (Array.isArray(data) ? data : []);
  const meta = data?.meta ?? null;

  const handleDelete = () => {
    destroy(deleteTarget.id, {
      onSuccess: (res) => { toast('success', res?.message ?? 'Supplier deleted'); setDeleteTarget(null); },
      onError:   (err) => { toast('error', err?.response?.data?.message ?? 'Failed to delete supplier'); setDeleteTarget(null); },
    });
  };

  const columns = [
    {
      key: 'name',
      label: 'Supplier',
      sortable: true,
      render: (row) => (
        <div>
          <div className="fw-semibold">{row.name}</div>
          {row.email && <small className="text-muted d-block">{row.email}</small>}
        </div>
      ),
    },
    { key: 'phone', label: 'Phone', sortable: true },
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
      label: 'Logo',
      className: 'text-center',
      render: (row) =>
        row.logo ? (
          <img
            src={row.logo}
            alt="logo"
            style={{ width: 36, height: 36, objectFit: 'cover', cursor: 'pointer', borderRadius: 4 }}
            onClick={() => setLightboxUrl(row.logo_full ?? row.logo)}
          />
        ) : <span className="text-muted small">—</span>,
    },
    {
      key: 'created_at',
      label: 'Added',
      sortable: true,
      render: (row) => <small className="text-muted">{formatDate(row.created_at)}</small>,
    },
    {
      label: 'Actions',
      className: 'text-center',
      render: (row) => (
        <div className="d-flex gap-1 justify-content-center">
          {canEdit && (
            <Link to={`/supplier/edit/${row.id}`} className="btn btn-sm btn-outline-primary btn-icon" title="Edit">
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
        title="Suppliers"
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Suppliers' }]}
        actionLabel={canCreate ? 'Add Supplier' : undefined}
        actionTo={canCreate ? '/supplier/create' : undefined}
        actionIcon={canCreate ? 'fa-plus' : undefined}
      />

      <div className="card">
        <div className="card-body">
          <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
            <div className="input-group" style={{ maxWidth: 280 }}>
              <span className="input-group-text"><i className="fa-solid fa-magnifying-glass" /></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name or phone…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
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
            orderBy={params.order_by}
            direction={params.direction}
            onSort={setSort}
            emptyText="No suppliers found."
          />
        </div>
      </div>

      <ConfirmDialog
        show={Boolean(deleteTarget)}
        title="Delete Supplier?"
        message={`Remove "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <AppModal show={Boolean(lightboxUrl)} title="Logo" onHide={() => setLightboxUrl(null)} size="sm">
        {lightboxUrl && <img src={lightboxUrl} alt="logo" className="img-fluid rounded" />}
      </AppModal>
    </div>
  );
}
