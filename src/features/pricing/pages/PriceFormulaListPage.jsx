import { useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import PageHeader from '../../../shared/components/PageHeader';
import DataTable from '../../../shared/components/DataTable';
import ConfirmDialog from '../../../shared/components/ConfirmDialog';
import { useTableParams } from '../../../shared/hooks/useTableParams';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { formatDate } from '../../../shared/utils/formatters';
import { usePriceFormulas, useDeletePriceFormula } from '../api';
import { useAuth } from '../../../shared/hooks/useAuth';

const toast = (icon, title) =>
  Swal.fire({ toast: true, position: 'top-end', icon, title, timer: 1400, showConfirmButton: false });

export default function PriceFormulaListPage() {
  const { hasPermission, isAdmin } = useAuth();
  const canManage = isAdmin || hasPermission('pricing.manage');

  const [searchInput, setSearchInput]   = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const debouncedSearch = useDebounce(searchInput, 400);
  const { params, setPage, setPerPage, setSort } = useTableParams({ orderBy: 'id', direction: 'desc', perPage: 15 });

  const queryParams = {
    page: params.page,
    per_page: params.per_page,
    order_by: params.order_by,
    direction: params.direction,
    search: debouncedSearch || undefined,
  };

  const { data, isLoading } = usePriceFormulas(queryParams);
  const formulas = data?.data ?? [];
  const meta     = data?.meta ?? null;

  const deleteFormula = useDeletePriceFormula();

  const handleDelete = async () => {
    try {
      const res = await deleteFormula.mutateAsync(deleteTarget.id);
      toast(res.status, res.message);
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Something went wrong';
      toast('error', msg);
    } finally {
      setDeleteTarget(null);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Formula Name',
      sortable: true,
      render: (row) => (
        <div>
          <div className="fw-semibold">{row.name}</div>
          {row.description && <small className="text-muted d-block">{row.description}</small>}
        </div>
      ),
    },
    {
      key: 'formula',
      label: 'Expression',
      render: (row) => (
        <code className="bg-light px-2 py-1 rounded text-dark" style={{ fontSize: '0.8rem' }}>
          {row.formula}
        </code>
      ),
    },
    {
      label: 'Field Limits',
      render: (row) =>
        row.field_limit ? (
          <div className="d-flex flex-wrap gap-1">
            {row.field_limit.split(';').map((part, i) => {
              const [field, range] = part.split(':');
              return (
                <span key={i} className="badge bg-light text-dark border" style={{ fontFamily: 'monospace' }}>
                  {field}: {range}
                </span>
              );
            })}
          </div>
        ) : <span className="text-muted small">—</span>,
    },
    {
      label: 'Status',
      className: 'text-center',
      render: (row) => (
        <span className={`badge ${row.status ? 'bg-success' : 'bg-secondary'}`}>
          {row.status ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'created_by',
      label: 'Created By',
      render: (row) => <small className="text-muted">{row.created_by}</small>,
    },
    {
      key: 'updated_at',
      label: 'Last Updated',
      sortable: true,
      render: (row) => <small className="text-muted">{formatDate(row.updated_at)}</small>,
    },
    {
      label: 'Actions',
      className: 'text-center',
      render: (row) => (
        <div className="d-flex gap-1 justify-content-center">
          {canManage && (
            <Link to={`/price-formulas/${row.id}/edit`} className="btn btn-sm btn-outline-primary btn-icon" title="Edit">
              <i className="fa-solid fa-pen" />
            </Link>
          )}
          {canManage && (
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
        title="Price Formulas"
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Price Formulas' }]}
        actionLabel={canManage ? 'Add Formula' : undefined}
        actionTo={canManage ? '/price-formulas/create' : undefined}
      />

      <div className="card">
        <div className="card-body">
          <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
            <div className="input-group" style={{ maxWidth: 280 }}>
              <span className="input-group-text"><i className="fa-solid fa-magnifying-glass" /></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search formulas…"
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
            data={formulas}
            isLoading={isLoading}
            meta={meta}
            onPageChange={setPage}
            orderBy={params.order_by}
            direction={params.direction}
            onSort={setSort}
            emptyText="No price formulas found."
          />
        </div>
      </div>

      <ConfirmDialog
        show={Boolean(deleteTarget)}
        title="Delete Formula?"
        message={`Remove "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteFormula.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
