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
import { useShops, useDeleteShop } from '../api';
import { useAuth } from '../../../shared/hooks/useAuth';

// Core branch IDs that cannot be deleted (business rule from legacy system)
const PROTECTED_IDS = [1, 3, 4];

const toast = (icon, title) =>
  Swal.fire({ toast: true, position: 'top-end', icon, title, timer: 1400, showConfirmButton: false });

export default function ShopListPage() {
  const { hasPermission, isAdmin } = useAuth();
  const canCreate = isAdmin || hasPermission('shops.create');
  const canEdit   = isAdmin || hasPermission('shops.edit');
  const canDelete = isAdmin || hasPermission('shops.delete');

  const [searchInput, setSearchInput] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [lightboxUrl, setLightboxUrl]   = useState(null);

  const debouncedSearch = useDebounce(searchInput, 400);
  const { params, setPage, setPerPage, setSort } = useTableParams({ orderBy: 'id', direction: 'asc', perPage: 15 });
  const { data, isLoading } = useShops({ ...params, search: debouncedSearch });
  const { mutate: destroy, isPending: deleting } = useDeleteShop();

  const rows = data?.data ?? (Array.isArray(data) ? data : []);
  const meta = data?.meta ?? null;

  const handleDelete = () => {
    destroy(deleteTarget.id, {
      onSuccess: (res) => { toast('success', res?.message ?? 'Shop deleted'); setDeleteTarget(null); },
      onError:   (err) => { toast('error', err?.response?.data?.message ?? 'Failed to delete shop'); setDeleteTarget(null); },
    });
  };

  const columns = [
    {
      key: 'name',
      label: 'Shop / Branch',
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
            onClick={() => setLightboxUrl(row.logo)}
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
      render: (row) => {
        const isProtected = PROTECTED_IDS.includes(Number(row.id));
        return (
          <div className="d-flex gap-1 justify-content-center">
            {canEdit && (
              <Link to={`/shop/edit/${row.id}`} className="btn btn-sm btn-outline-primary btn-icon" title="Edit">
                <i className="fa-solid fa-pen" />
              </Link>
            )}
            {canDelete && (
              <button
                className="btn btn-sm btn-outline-danger btn-icon"
                onClick={() => setDeleteTarget(row)}
                disabled={isProtected}
                title={isProtected ? 'Core branch — cannot be deleted' : 'Delete'}
              >
                <i className="fa-solid fa-trash" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Shops & Branches"
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Shops' }]}
        actionLabel={canCreate ? 'Add Shop' : undefined}
        actionTo={canCreate ? '/shop/create' : undefined}
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
            emptyText="No shops found."
          />
        </div>
      </div>

      <ConfirmDialog
        show={Boolean(deleteTarget)}
        title="Delete Shop?"
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
