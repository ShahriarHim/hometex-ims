import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../../shared/components/PageHeader';
import DataTable from '../../../shared/components/DataTable';
import { useTableParams } from '../../../shared/hooks/useTableParams';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { formatDateTime } from '../../../shared/utils/formatters';
import { useReturnList } from '../api';

export default function ReturnListPage() {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 400);
  const { params, setPage, setPerPage } = useTableParams({ perPage: 20 });

  const { data, isLoading } = useReturnList({
    ...params,
    search: debouncedSearch || undefined,
  });

  const items = data?.data ?? [];
  const meta  = data?.meta ?? null;

  const columns = [
    {
      label: 'Product',
      render: (row) => (
        <>
          <div className="fw-semibold">{row.product?.name ?? '—'}</div>
          {row.product?.sku && <small className="text-muted">{row.product.sku}</small>}
        </>
      ),
    },
    {
      label: 'Returned To',
      render: (row) => <span>{row.shop?.name ?? '—'}</span>,
    },
    {
      label: 'Qty',
      className: 'text-center',
      render: (row) => <span className="badge bg-danger">{row.quantity}</span>,
    },
    {
      label: 'Order',
      render: (row) => (
        <>
          <small className="text-muted d-block">{row.reference_type}</small>
          <strong>#{row.reference_id}</strong>
        </>
      ),
    },
    {
      label: 'Notes',
      render: (row) => <small className="text-muted">{row.notes ?? '—'}</small>,
    },
    {
      label: 'By / Date',
      render: (row) => (
        <>
          <small className="text-muted d-block">{row.created_by ?? '—'}</small>
          <small className="text-theme">{formatDateTime(row.created_at)}</small>
        </>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Return Log"
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Returns' }]}
        actionLabel="New Return"
        actionTo="/returns"
      />

      <div className="card">
        <div className="card-header">
          <div className="row g-2 align-items-end">
            <div className="col-md-4">
              <label className="form-label mb-1 small fw-semibold">Search</label>
              <input
                className="form-control form-control-sm"
                type="search"
                placeholder="Product name, SKU or order ID…"
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1 small fw-semibold">Per page</label>
              <select
                className="form-select form-select-sm"
                value={params.per_page}
                onChange={(e) => setPerPage(Number(e.target.value))}
              >
                {[20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="card-body p-0 p-md-3">
          <DataTable
            columns={columns}
            data={items}
            isLoading={isLoading}
            meta={meta}
            onPageChange={setPage}
            showSerial
            emptyText="No returns recorded yet."
          />
        </div>
      </div>
    </>
  );
}
