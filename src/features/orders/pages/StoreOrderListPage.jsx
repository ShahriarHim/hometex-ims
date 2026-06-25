import { useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import PageHeader from '../../../shared/components/PageHeader';
import DataTable from '../../../shared/components/DataTable';
import { useTableParams } from '../../../shared/hooks/useTableParams';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { formatPrice, formatDateTime } from '../../../shared/utils/formatters';
import { useStoreOrders, useShopList, useCancelStoreOrder } from '../api';
import { useAuth } from '../../../shared/hooks/useAuth';

const STATUS_CLS = {
  completed: 'bg-success',
  cancelled:  'bg-danger',
  pending:    'bg-warning text-dark',
};

export default function StoreOrderListPage() {
  const { hasPermission, isAdmin } = useAuth();
  const canCreate = isAdmin || hasPermission('orders.create');
  const canCancel = isAdmin || hasPermission('store_orders.cancel');

  const [searchInput, setSearchInput] = useState('');
  const [shopFilter, setShopFilter]   = useState('');
  const [selected, setSelected]       = useState([]);

  const debouncedSearch = useDebounce(searchInput, 400);

  const { params, setPage, setPerPage, setSort } = useTableParams({
    orderBy: 'id',
    direction: 'desc',
    perPage: 15,
  });

  const queryParams = {
    ...params,
    search: debouncedSearch,
    ...(shopFilter ? { shop_id: shopFilter } : {}),
  };

  const { data, isLoading, refetch } = useStoreOrders(queryParams);
  const { data: shops = [] }          = useShopList();
  const cancelMutation                = useCancelStoreOrder();

  const rows = data?.data ?? [];
  const meta = data?.meta ?? null;

  const allActiveIds = rows.filter((r) => r.status !== 'cancelled').map((r) => r.id);
  const allSelected  = allActiveIds.length > 0 && allActiveIds.every((id) => selected.includes(id));

  const toggleAll = () => {
    setSelected(allSelected ? [] : allActiveIds);
  };

  const toggleOne = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const openCancelDialog = () =>
    Swal.fire({
      title: 'Cancel order — provide details',
      html: `
        <label class="text-start d-block mb-1 mt-2">Cancelled by</label>
        <input id="sw-by" class="swal2-input" placeholder="Your name" />
        <label class="text-start d-block mb-1 mt-3">Reason</label>
        <textarea id="sw-reason" class="swal2-textarea" rows="3" placeholder="Reason">customer returned items</textarea>
      `,
      showCancelButton: true,
      confirmButtonText: 'Confirm cancellation',
      confirmButtonColor: '#dc3545',
      preConfirm: () => {
        const by     = document.getElementById('sw-by')?.value?.trim();
        const reason = document.getElementById('sw-reason')?.value?.trim();
        if (!by) { Swal.showValidationMessage('Cancelled by is required'); return false; }
        if (!reason) { Swal.showValidationMessage('Reason is required'); return false; }
        return { cancelled_by: by, reason };
      },
    });

  const handleCancelOne = async (order) => {
    if (order.status === 'cancelled') {
      Swal.fire({ icon: 'info', title: 'Already cancelled', timer: 1500, showConfirmButton: false });
      return;
    }
    const result = await openCancelDialog();
    if (!result.isConfirmed) return;
    cancelMutation.mutate(
      { store_order_id: order.id, ...result.value, status: 'cancelled' },
      {
        onSuccess: () => {
          Swal.fire({ icon: 'success', title: 'Order cancelled', timer: 1500, showConfirmButton: false });
          refetch();
        },
        onError: (err) => Swal.fire({ icon: 'error', title: err?.response?.data?.message ?? 'Failed to cancel' }),
      }
    );
  };

  const handleBulkCancel = async () => {
    if (selected.length === 0) return;
    const result = await openCancelDialog();
    if (!result.isConfirmed) return;
    const payloads = selected.map((id) => ({
      store_order_id: id,
      ...result.value,
      status: 'cancelled',
    }));
    await Promise.all(payloads.map((p) => cancelMutation.mutateAsync(p))).then(() => {
      Swal.fire({ icon: 'success', title: `${selected.length} order(s) cancelled`, timer: 1500, showConfirmButton: false });
      setSelected([]);
      refetch();
    }).catch((err) => {
      Swal.fire({ icon: 'error', title: err?.response?.data?.message ?? 'Some orders could not be cancelled' });
      refetch();
    });
  };

  const columns = [
    {
      label: '',
      className: 'text-center',
      render: (row) =>
        row.status !== 'cancelled' ? (
          <input
            type="checkbox"
            checked={selected.includes(row.id)}
            onChange={() => toggleOne(row.id)}
          />
        ) : null,
    },
    {
      key: 'id',
      label: 'Order',
      sortable: true,
      render: (row) => (
        <div>
          <div className="fw-semibold">#{row.id}</div>
          <span className={`badge mt-1 ${STATUS_CLS[row.status] ?? 'bg-secondary'}`}>
            {row.status}
          </span>
        </div>
      ),
    },
    {
      label: 'Customer',
      render: (row) => row.customer_number || '—',
    },
    {
      label: 'Branch',
      render: (row) => {
        if (row.shop?.name) return row.shop.name;
        if (row.shop_id) return shops.find((s) => s.id === row.shop_id)?.name ?? `Shop #${row.shop_id}`;
        return '—';
      },
    },
    {
      label: 'Amount',
      render: (row) => (
        <div className="small">
          <div>Total: <strong>{formatPrice(row.total_amount)}</strong></div>
          {Number(row.due_amount) > 0 && (
            <div>Due: <span className="text-danger">{formatPrice(row.due_amount)}</span></div>
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Date',
      sortable: true,
      render: (row) => <small className="text-muted">{formatDateTime(row.created_at)}</small>,
    },
    {
      label: 'Actions',
      className: 'text-center',
      render: (row) => (
        <div className="d-flex gap-1 justify-content-center">
          <Link to={`/store-order/${row.id}`} className="btn btn-sm btn-outline-info btn-icon" title="View">
            <i className="fa-solid fa-eye" />
          </Link>
          {row.status !== 'cancelled' && canCancel && (
            <button
              className="btn btn-sm btn-outline-danger btn-icon"
              title="Cancel"
              onClick={() => handleCancelOne(row)}
              disabled={cancelMutation.isPending}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Store Orders"
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Store Orders' }]}
        actionLabel={canCreate ? 'Create Order' : undefined}
        actionTo={canCreate ? '/orders/create' : undefined}
      />

      <div className="card">
        <div className="card-body">
          {/* Toolbar */}
          <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between mb-3">
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <div className="input-group" style={{ width: 240 }}>
                <span className="input-group-text">
                  <i className="fa-solid fa-magnifying-glass" />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Order ID or customer number…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>

              <select
                className="form-select"
                style={{ width: 180 }}
                value={shopFilter}
                onChange={(e) => setShopFilter(e.target.value)}
              >
                <option value="">All Branches</option>
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              {selected.length > 0 && canCancel && (
                <button
                  className="btn btn-sm btn-danger"
                  onClick={handleBulkCancel}
                  disabled={cancelMutation.isPending}
                >
                  Cancel selected ({selected.length})
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
            </div>
          </div>

          {/* Select-all row */}
          {rows.length > 0 && (
            <div className="mb-2 d-flex align-items-center gap-2">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              <small className="text-muted">Select all non-cancelled</small>
            </div>
          )}

          <DataTable
            columns={columns}
            data={rows}
            isLoading={isLoading}
            meta={meta}
            onPageChange={setPage}
            orderBy={params.order_by}
            direction={params.direction}
            onSort={setSort}
            showSerial={false}
            emptyText="No store orders found."
          />
        </div>
      </div>
    </div>
  );
}
