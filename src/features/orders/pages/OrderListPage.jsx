import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../../shared/components/PageHeader';
import DataTable from '../../../shared/components/DataTable';
import { useTableParams } from '../../../shared/hooks/useTableParams';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { formatPrice, formatDateTime } from '../../../shared/utils/formatters';
import { useOrders, useShopList } from '../api';
import { useAuth } from '../../../shared/hooks/useAuth';

const ORDER_STATUS_MAP = {
  1: { label: 'Pending',    cls: 'bg-warning text-dark' },
  2: { label: 'Processing', cls: 'bg-info text-dark' },
  3: { label: 'Delivered',  cls: 'bg-success' },
  4: { label: 'Cancelled',  cls: 'bg-danger' },
  5: { label: 'Returned',   cls: 'bg-secondary' },
};

const PAYMENT_STATUS_CLS = {
  'Paid':           'bg-success',
  'Partially Paid': 'bg-warning text-dark',
};

function OrderStatusBadge({ status, label }) {
  const map = ORDER_STATUS_MAP[status];
  return (
    <span className={`badge ${map?.cls ?? 'bg-secondary'}`}>
      {label ?? map?.label ?? `Status ${status}`}
    </span>
  );
}

function PaymentBadge({ status }) {
  const cls = PAYMENT_STATUS_CLS[status] ?? 'bg-danger';
  return <span className={`badge ${cls}`}>{status || 'Unpaid'}</span>;
}

export default function OrderListPage() {
  const { hasPermission, isAdmin } = useAuth();
  const canCreate = isAdmin || hasPermission('orders.create');
  const canAdjust = isAdmin || hasPermission('inventory.adjust');

  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [shopFilter, setShopFilter] = useState('');

  const debouncedSearch = useDebounce(searchInput, 400);

  const { params, setPage, setPerPage, setSort } = useTableParams({
    orderBy: 'id',
    direction: 'desc',
    perPage: 15,
  });

  const queryParams = {
    ...params,
    search: debouncedSearch,
    ...(statusFilter ? { order_status: statusFilter } : {}),
    ...(shopFilter ? { shop_id: shopFilter } : {}),
  };

  const { data, isLoading } = useOrders(queryParams);
  const { data: shops = [] } = useShopList();

  const rows = data?.data ?? [];
  const meta = data?.meta ?? null;

  const columns = [
    {
      key: 'order_number',
      label: 'Order',
      sortable: true,
      render: (row) => (
        <div>
          <div className="fw-semibold">{row.order_number}</div>
          <div className="mt-1 d-flex gap-1 flex-wrap">
            <OrderStatusBadge status={row.order_status} label={row.order_status_string} />
            <PaymentBadge status={row.payment_status} />
            {row.needs_adjustment && (
              <span className="badge bg-danger">Needs Adjustment</span>
            )}
          </div>
        </div>
      ),
    },
    {
      label: 'Customer',
      render: (row) => (
        <div>
          <div>{row.customer_name || '—'}</div>
          {row.customer_phone && <small className="text-muted">{row.customer_phone}</small>}
        </div>
      ),
    },
    {
      label: 'Amount',
      render: (row) => (
        <div className="small">
          <div>Total: <strong>{formatPrice(row.total)}</strong></div>
          <div>Paid: <span className="text-success">{formatPrice(row.paid_amount)}</span></div>
          {Number(row.due_amount) > 0 && (
            <div>Due: <span className="text-danger">{formatPrice(row.due_amount)}</span></div>
          )}
        </div>
      ),
    },
    {
      label: 'Shop / Manager',
      render: (row) => (
        <div className="small">
          {row.shop && <div>{row.shop}</div>}
          {row.sales_manager && <div className="text-muted">{row.sales_manager}</div>}
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Date',
      sortable: true,
      render: (row) => (
        <small className="text-muted">{formatDateTime(row.created_at)}</small>
      ),
    },
    {
      label: 'Actions',
      className: 'text-center',
      render: (row) => (
        <div className="d-flex gap-1 justify-content-center">
          <Link to={`/order/${row.id}`} className="btn btn-sm btn-outline-info btn-icon" title="View">
            <i className="fa-solid fa-eye" />
          </Link>
          {canAdjust && (
            <Link
              to={`/adjustments?order_id=${row.id}`}
              className={`btn btn-sm btn-icon ${row.needs_adjustment ? 'btn-warning' : 'btn-outline-secondary'}`}
              title={row.needs_adjustment ? 'Needs adjustment' : 'Adjustment'}
            >
              <i className="fa-solid fa-sliders" />
            </Link>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Orders"
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Orders' }]}
        actionLabel={canCreate ? 'Create Order' : undefined}
        actionTo={canCreate ? '/orders/create' : undefined}
      />

      <div className="card">
        <div className="card-body">
          {/* Toolbar */}
          <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between mb-3">
            <div className="d-flex flex-wrap gap-2">
              {/* Search */}
              <div className="input-group" style={{ width: 240 }}>
                <span className="input-group-text">
                  <i className="fa-solid fa-magnifying-glass" />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Order #, customer…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>

              {/* Status filter */}
              <select
                className="form-select"
                style={{ width: 160 }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                {Object.entries(ORDER_STATUS_MAP).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>

              {/* Shop filter */}
              <select
                className="form-select"
                style={{ width: 160 }}
                value={shopFilter}
                onChange={(e) => setShopFilter(e.target.value)}
              >
                <option value="">All Branches</option>
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
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
                {[10, 15, 25, 50].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
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
            emptyText="No orders found."
          />
        </div>
      </div>
    </div>
  );
}
