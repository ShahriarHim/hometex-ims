import { useParams, Link } from 'react-router-dom';
import PageHeader from '../../../shared/components/PageHeader';
import { SkeletonTable } from '../../../shared/components/Skeleton';
import { formatPrice, formatDateTime } from '../../../shared/utils/formatters';
import { useCustomerOrders } from '../api';

const ECOM_STATUS = {
  1: { label: 'Pending',    cls: 'bg-warning text-dark' },
  2: { label: 'Processing', cls: 'bg-info text-dark' },
  3: { label: 'Delivered',  cls: 'bg-success' },
  4: { label: 'Cancelled',  cls: 'bg-danger' },
};

const STORE_STATUS = {
  pending:   { label: 'Pending',   cls: 'bg-warning text-dark' },
  completed: { label: 'Completed', cls: 'bg-success' },
  cancelled: { label: 'Cancelled', cls: 'bg-danger' },
};

export default function CustomerOrdersPage() {
  const { id } = useParams();
  const { data, isLoading } = useCustomerOrders(id);

  const customer    = data?.customer;
  const ecomOrders  = data?.ecommerce_orders ?? [];
  const storeOrders = data?.store_orders ?? [];
  const totalOrders = ecomOrders.length + storeOrders.length;
  const customerName = customer?.name ?? `Customer #${id}`;

  return (
    <>
      <PageHeader
        title={`Orders — ${customerName}`}
        breadcrumb={[
          { label: 'Home', to: '/' },
          { label: 'Customers', to: '/customers' },
          { label: customerName },
        ]}
        actionLabel="All Customers"
        actionTo="/customers"
        actionIcon="fa-arrow-left"
      />

      {customer && (
        <div className="card mb-3">
          <div className="card-body py-2 d-flex flex-wrap gap-4" style={{ fontSize: '0.85rem' }}>
            <span><i className="fa-solid fa-user me-2 text-muted" />{customer.name}</span>
            {customer.phone && <span><i className="fa-solid fa-phone me-2 text-muted" />{customer.phone}</span>}
            {customer.email && <span><i className="fa-solid fa-envelope me-2 text-muted" />{customer.email}</span>}
            <span className="ms-auto text-muted">{totalOrders} order{totalOrders !== 1 ? 's' : ''} total</span>
          </div>
        </div>
      )}

      {isLoading ? (
        <SkeletonTable rows={8} cols={5} />
      ) : totalOrders === 0 ? (
        <div className="card">
          <div className="card-body text-center text-muted py-5">
            <i className="fa-solid fa-receipt fa-2x mb-2 d-block opacity-25" />
            No orders found for this customer.
          </div>
        </div>
      ) : (
        <>
          {ecomOrders.length > 0 && (
            <div className="card mb-3">
              <div className="card-header fw-semibold">
                <i className="fa-solid fa-globe me-2 text-primary" />
                Online / POS Orders ({ecomOrders.length})
              </div>
              <div className="card-body p-0">
                <table className="table table-sm table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Order #</th>
                      <th>Status</th>
                      <th>Shop</th>
                      <th className="text-end">Total</th>
                      <th>Date</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ecomOrders.map((o) => {
                      const st = ECOM_STATUS[o.order_status] ?? { label: '—', cls: 'bg-secondary' };
                      return (
                        <tr key={o.id}>
                          <td className="fw-semibold">{o.order_number ?? `#${o.id}`}</td>
                          <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                          <td><small className="text-muted">{o.shop?.name ?? '—'}</small></td>
                          <td className="text-end fw-semibold">{formatPrice(o.total)}</td>
                          <td><small className="text-muted">{formatDateTime(o.created_at)}</small></td>
                          <td className="text-center">
                            <Link to={`/order/${o.id}`} className="btn btn-sm btn-outline-info py-0">
                              <i className="fa-solid fa-eye" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {storeOrders.length > 0 && (
            <div className="card">
              <div className="card-header fw-semibold">
                <i className="fa-solid fa-store me-2 text-success" />
                Store / Counter Orders ({storeOrders.length})
                {customer?.phone && (
                  <small className="text-muted fw-normal ms-2">matched by phone: {customer.phone}</small>
                )}
              </div>
              <div className="card-body p-0">
                <table className="table table-sm table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Order #</th>
                      <th>Status</th>
                      <th>Shop</th>
                      <th className="text-end">Total</th>
                      <th>Date</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storeOrders.map((o) => {
                      const st = STORE_STATUS[o.status] ?? { label: o.status ?? '—', cls: 'bg-secondary' };
                      return (
                        <tr key={o.id}>
                          <td className="fw-semibold">#{o.id}</td>
                          <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                          <td><small className="text-muted">{o.shop?.name ?? '—'}</small></td>
                          <td className="text-end fw-semibold">{formatPrice(o.total_amount)}</td>
                          <td><small className="text-muted">{formatDateTime(o.created_at)}</small></td>
                          <td className="text-center">
                            <Link to={`/store-order/${o.id}`} className="btn btn-sm btn-outline-info py-0">
                              <i className="fa-solid fa-eye" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
