import { useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import PageHeader from '../../../shared/components/PageHeader';
import DataTable from '../../../shared/components/DataTable';
import ConfirmDialog from '../../../shared/components/ConfirmDialog';
import AppModal from '../../../shared/components/AppModal';
import { useTableParams } from '../../../shared/hooks/useTableParams';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import dayjs from 'dayjs';
import { useAuth } from '../../../shared/hooks/useAuth';

/**
 * CatalogList — shared list page for Brand / Category / SubCategory / ChildSubCategory.
 *
 * config shape:
 *   title           string       'Brand List'
 *   entityLabel     string       'Brand' — used in toasts
 *   createPath      string       '/brand/create'
 *   editPath        (id)=>string id => `/brand/edit/${id}`
 *   breadcrumb      array        [{label,to?}]
 *   photoLabel      string       'Logo' | 'Photo'
 *   photoField      string       'logo_preview' | 'photo_preview'
 *   parentLabel     string|null  'Category' | null
 *   parentRender    (row)=>node  optional custom render for parent cell
 *   useList         hook         useBrands
 *   useDelete       hook         useDeleteBrand
 */
export default function CatalogList({ config }) {
  const {
    title,
    entityLabel,
    createPath,
    editPath,
    breadcrumb,
    photoLabel = 'Photo',
    photoField = 'photo_preview',
    parentLabel = null,
    parentRender = null,
    useList,
    useDelete,
  } = config;

  const { hasPermission, isAdmin } = useAuth();
  const canCreate = isAdmin || hasPermission('catalog.create');
  const canEdit   = isAdmin || hasPermission('catalog.edit');
  const canDelete = isAdmin || hasPermission('catalog.delete');

  const [searchInput, setSearchInput]   = useState('');
  const [lightboxSrc, setLightboxSrc]   = useState(null);
  const [deleteId, setDeleteId]         = useState(null);

  const debouncedSearch = useDebounce(searchInput, 400);

  const { params, setPage, setSearch, setPerPage, setSort } = useTableParams({
    orderBy: 'serial',
    direction: 'asc',
    perPage: 15,
  });

  // Keep search param in sync with debounced value
  const [lastDebounced, setLastDebounced] = useState('');
  if (debouncedSearch !== lastDebounced) {
    setLastDebounced(debouncedSearch);
    setSearch(debouncedSearch);
  }

  const { data, isLoading } = useList(params);
  const deleteMutation = useDelete();

  const rows = data?.data ?? [];
  const meta = data?.meta ?? null;

  const handleDelete = () => {
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null);
        Swal.fire({ icon: 'success', title: `${entityLabel} deleted`, timer: 1500, showConfirmButton: false });
      },
      onError: () => {
        setDeleteId(null);
        Swal.fire({ icon: 'error', title: 'Delete failed', text: 'Please try again.' });
      },
    });
  };

  const columns = [
    {
      key: 'name',
      label: 'Name / Slug',
      sortable: true,
      render: (row) => (
        <div>
          <div className="fw-semibold">{row.name}</div>
          {row.slug && <small className="text-muted">{row.slug}</small>}
        </div>
      ),
    },
    ...(parentLabel
      ? [{
          label: parentLabel,
          render: parentRender
            ? parentRender
            : (row) => row[`${parentLabel.toLowerCase().replace(' ', '_')}_name`] || '—',
        }]
      : []),
    {
      key: 'serial',
      label: 'Order',
      sortable: true,
      className: 'text-center',
      render: (row) => <span className="text-muted">{row.serial ?? '—'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      className: 'text-center',
      render: (row) => (
        <span className={`badge ${Number(row.status) === 1 ? 'bg-success' : 'bg-secondary'}`}>
          {Number(row.status) === 1 ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      label: photoLabel,
      className: 'text-center',
      render: (row) => {
        const src = row[photoField];
        return src ? (
          <img
            src={src}
            alt={row.name}
            width={40}
            height={40}
            style={{ objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
            onClick={() => setLightboxSrc(src)}
          />
        ) : (
          <span className="text-muted">
            <i className="fa-regular fa-image" />
          </span>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Date',
      sortable: true,
      render: (row) => (
        <small className="text-muted">
          {row.created_at ? dayjs(row.created_at).format('DD MMM YYYY') : '—'}
        </small>
      ),
    },
    {
      label: 'Actions',
      className: 'text-center',
      render: (row) => (
        <div className="d-flex gap-1 justify-content-center">
          {canEdit && (
            <Link to={editPath(row.id)} className="btn btn-sm btn-outline-primary btn-icon" title="Edit">
              <i className="fa-solid fa-pen-to-square" />
            </Link>
          )}
          {canDelete && (
            <button
              className="btn btn-sm btn-outline-danger btn-icon"
              title="Delete"
              onClick={() => setDeleteId(row.id)}
            >
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
        title={title}
        breadcrumb={breadcrumb}
        actionLabel={canCreate ? `Add ${entityLabel}` : undefined}
        actionTo={canCreate ? createPath : undefined}
      />

      <div className="card">
        <div className="card-body">
          {/* Toolbar */}
          <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
            <div className="input-group" style={{ maxWidth: 280 }}>
              <span className="input-group-text">
                <i className="fa-solid fa-magnifying-glass" />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder={`Search ${entityLabel}...`}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setSearchInput('')}
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
            </div>

            <div className="d-flex align-items-center gap-2">
              <label className="text-muted small mb-0">Show</label>
              <select
                className="form-select form-select-sm"
                style={{ width: 70 }}
                value={params.per_page}
                onChange={(e) => setPerPage(Number(e.target.value))}
              >
                {[10, 15, 25, 50].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="text-muted small">entries</span>
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
            emptyText={`No ${entityLabel.toLowerCase()}s found.`}
          />
        </div>
      </div>

      {/* Photo lightbox */}
      <AppModal
        show={Boolean(lightboxSrc)}
        title={`${photoLabel} Preview`}
        onHide={() => setLightboxSrc(null)}
        footer={
          <button className="btn btn-sm btn-secondary" onClick={() => setLightboxSrc(null)}>
            Close
          </button>
        }
      >
        {lightboxSrc && (
          <div className="text-center">
            <img
              src={lightboxSrc}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain' }}
            />
          </div>
        )}
      </AppModal>

      {/* Delete confirm */}
      <ConfirmDialog
        show={Boolean(deleteId)}
        title={`Delete ${entityLabel}?`}
        message="This action cannot be undone."
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
