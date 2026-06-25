import { useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageHeader from '../../../shared/components/PageHeader';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import { formatPrice, formatDateTime } from '../../../shared/utils/formatters';
import { useStoreOrder } from '../api';

const STATUS_CLS = { completed: 'bg-success', cancelled: 'bg-danger', pending: 'bg-warning text-dark' };

function Row({ label, value }) {
  return (
    <tr>
      <th className="text-nowrap" style={{ width: '40%' }}>{label}</th>
      <td>{value ?? '—'}</td>
    </tr>
  );
}

export default function StoreOrderDetailsPage() {
  const { id }   = useParams();
  const printRef = useRef(null);

  const { data: order, isLoading, error } = useStoreOrder(id);

  const handlePrint = () => window.print();

  if (isLoading) return <LoadingSpinner />;
  if (error || !order) return (
    <div className="alert alert-warning">
      Store order not found. <Link to="/store-orders">Back to list</Link>
    </div>
  );

  const details = order.details ?? [];
  const shop    = order.shop ?? {};
  const shopAddress = shop.address;
  const addressParts = shopAddress
    ? [shopAddress.address, shopAddress.area?.name, shopAddress.district?.name].filter(Boolean)
    : [];

  const salesPerson = order.created_by_sales_manager?.name
    ?? order.created_by_user?.name
    ?? '—';

  return (
    <div>
      {/* Print-only receipt */}
      <div className="print-only" ref={printRef}>
        <div className="text-center mb-3">
          <h5 className="mb-0">{shop.name || 'Hometex Bangladesh Ltd.'}</h5>
          {addressParts.length > 0 && <div className="small">{addressParts.join(', ')}</div>}
          {shopAddress?.bin && <div className="small">BIN: {shopAddress.bin}</div>}
        </div>
        <div className="d-flex justify-content-between mb-2 small">
          <span>Order #{order.id}</span>
          <span>{formatDateTime(order.created_at)}</span>
        </div>
        <div className="small mb-2">
          Customer: {order.customer_number || '—'} | Payment: {order.payment_method?.name || 'CASH'}
        </div>
        <table className="table table-sm table-bordered" style={{ fontSize: 12 }}>
          <thead>
            <tr><th>#</th><th>Item</th><th className="text-center">Qty</th><th className="text-end">Price</th><th className="text-end">Total</th></tr>
          </thead>
          <tbody>
            {details.map((d, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{d.product_name ?? d.name}<br /><small className="text-muted">{d.sku}</small></td>
                <td className="text-center">{d.quantity}</td>
                <td className="text-end">{formatPrice(d.price ?? d.unit_price)}</td>
                <td className="text-end">{formatPrice((d.price ?? d.unit_price ?? 0) * d.quantity)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan={4} className="text-end"><strong>Total</strong></td><td className="text-end"><strong>{formatPrice(order.total_amount)}</strong></td></tr>
            <tr><td colSpan={4} className="text-end">Paid</td><td className="text-end">{formatPrice(order.paid_amount)}</td></tr>
            {Number(order.due_amount) > 0 && (
              <tr><td colSpan={4} className="text-end text-danger">Due</td><td className="text-end text-danger">{formatPrice(order.due_amount)}</td></tr>
            )}
          </tfoot>
        </table>
        <div className="text-center small mt-2">Thank you for shopping with us!</div>
      </div>

      <PageHeader
        title={`Store Order #${order.id}`}
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Store Orders', to: '/store-orders' }, { label: `#${order.id}` }]}
        actionLabel="Back"
        actionTo="/store-orders"
        actionIcon="fa-arrow-left"
      />

      {/* Status + Actions */}
      <div className="d-flex align-items-center gap-2 mb-3 no-print">
        <span className={`badge fs-6 ${STATUS_CLS[order.status] ?? 'bg-secondary'}`}>{order.status}</span>
        <button className="btn btn-sm btn-outline-secondary ms-auto" onClick={handlePrint}>
          <i className="fa-solid fa-print me-1" /> Print Receipt
        </button>
      </div>

      <div className="row g-3">
        {/* Order Info */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header py-2"><strong>Order Details</strong></div>
            <div className="card-body p-0">
              <table className="table table-sm table-bordered mb-0">
                <tbody>
                  <Row label="Order ID"       value={`#${order.id}`} />
                  <Row label="Status"         value={<span className={`badge ${STATUS_CLS[order.status] ?? 'bg-secondary'}`}>{order.status}</span>} />
                  <Row label="Customer"       value={order.customer_number} />
                  <Row label="Payment Method" value={order.payment_method?.name} />
                  <Row label="Created By"     value={salesPerson} />
                  <Row label="Date"           value={formatDateTime(order.created_at)} />
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Shop Info */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header py-2"><strong>Branch / Shop</strong></div>
            <div className="card-body p-0">
              <table className="table table-sm table-bordered mb-0">
                <tbody>
                  <Row label="Shop Name" value={shop.name} />
                  {addressParts.length > 0 && <Row label="Address" value={addressParts.join(', ')} />}
                  {shopAddress?.bin && <Row label="BIN" value={shopAddress.bin} />}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Financials */}
        <div className="col-md-12">
          <div className="card">
            <div className="card-header py-2"><strong>Financial Summary</strong></div>
            <div className="card-body p-0">
              <table className="table table-sm table-bordered mb-0">
                <tbody>
                  <tr>
                    <th>Subtotal</th><td>{formatPrice(order.subtotal ?? order.total_amount)}</td>
                    <th>Discount</th><td>{formatPrice(order.discount_amount ?? 0)}</td>
                  </tr>
                  <tr>
                    <th>Tax</th><td>{formatPrice(order.tax_amount ?? 0)}</td>
                    <th>Total</th><td><strong>{formatPrice(order.total_amount)}</strong></td>
                  </tr>
                  <tr>
                    <th>Paid</th><td><span className="text-success fw-semibold">{formatPrice(order.paid_amount)}</span></td>
                    <th>Due</th><td><span className="text-danger fw-semibold">{formatPrice(order.due_amount)}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="col-md-12">
          <div className="card">
            <div className="card-header py-2"><strong>Order Items</strong></div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-sm table-bordered mb-0">
                  <thead>
                    <tr>
                      <th>SL</th><th>Product</th><th>SKU</th>
                      <th className="text-center">Qty</th>
                      <th className="text-end">Unit Price</th>
                      <th className="text-end">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.length === 0 ? (
                      <tr><td colSpan={6} className="text-center text-muted py-3">No items.</td></tr>
                    ) : (
                      details.map((d, i) => {
                        const unitPrice = d.price ?? d.unit_price ?? 0;
                        return (
                          <tr key={i}>
                            <td>{i + 1}</td>
                            <td>
                              <div className="fw-semibold">{d.product_name ?? d.name}</div>
                              {d.attribute_name && <small className="text-muted">{d.attribute_name}</small>}
                            </td>
                            <td><small>{d.sku}</small></td>
                            <td className="text-center">{d.quantity}</td>
                            <td className="text-end">{formatPrice(unitPrice)}</td>
                            <td className="text-end">{formatPrice(unitPrice * d.quantity)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={5} className="text-end fw-bold">Total</td>
                      <td className="text-end fw-bold">{formatPrice(order.total_amount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
