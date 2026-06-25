import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../../shared/components/PageHeader';
import DataTable from '../../../shared/components/DataTable';
import { useTableParams } from '../../../shared/hooks/useTableParams';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { formatDate } from '../../../shared/utils/formatters';
import { useCustomers } from '../api';

export default function CustomerListPage() {
  const [searchInput, setSearchInput] = useState('');
  const [hasOrders, setHasOrders] = useState(true);
  const debouncedSearch = useDebounce(searchInput, 400);

  const { params, setPage, setPerPage, setSort } = useTableParams({
    orderBy: 'id',
    direction: 'desc',
    perPage: 15,
  });

  const queryParams = {
    ...params,
    search: debouncedSearch,
    has_orders: hasOrders ? '1' : undefined,
  };
  const { data, isLoading } = useCustomers(queryParams);

  const rows = data?.data ?? (Array.isArray(data) ? data : []);
  const meta = data?.meta ?? null;

  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (row) => (
        <div>
          <div className="fw-semibold">{row.name || '—'}</div>
          {row.email && <small className="text-muted">{row.email}</small>}
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: true,
    },
    {
      label: 'Orders',
      className: 'text-center',
      render: (row) => {
        const total = (row.ecom_orders_count ?? 0) + (row.store_orders_count ?? 0);
        return (
          <div className="d-flex flex-column align-items-center gap-1">
            <span className={`badge ${total > 0 ? 'bg-primary' : 'bg-light text-muted border'}`}>
              {total} total
            </span>
            {(row.ecom_orders_count > 0 || row.store_orders_count > 0) && (
              <small className="text-muted" style={{ fontSize: '0.68rem' }}>
                {row.ecom_orders_count > 0 && `${row.ecom_orders_count} online`}
                {row.ecom_orders_count > 0 && row.store_orders_count > 0 && ' · '}
                {row.store_orders_count > 0 && `${row.store_orders_count} store`}
              </small>
            )}
          </div>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Joined',
      sortable: true,
      render: (row) => <small className="text-muted">{formatDate(row.created_at)}</small>,
    },
    {
      label: 'Actions',
      className: 'text-center',
      render: (row) => (
        <Link
          to={`/customers/${row.id}/orders`}
          className="btn btn-sm btn-outline-info"
          title="View orders"
        >
          <i className="fa-solid fa-receipt me-1" />Orders
        </Link>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Customers"
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Customers' }]}
      />

      <div className="card">
        <div className="card-body">
          <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
            <div className="input-group" style={{ maxWidth: 280 }}>
              <span className="input-group-text">
                <i className="fa-solid fa-magnifying-glass" />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name or phone…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            <div className="d-flex align-items-center gap-3">
              <div className="form-check form-switch mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="hasOrdersToggle"
                  checked={hasOrders}
                  onChange={(e) => { setHasOrders(e.target.checked); setPage(1); }}
                />
                <label className="form-check-label small text-muted" htmlFor="hasOrdersToggle">
                  Has orders only
                </label>
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
              </div>
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
            emptyText={hasOrders ? 'No customers with orders found.' : 'No customers found.'}
          />
        </div>
      </div>
    </div>
  );
}
