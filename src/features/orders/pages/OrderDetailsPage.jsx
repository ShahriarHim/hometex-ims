import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import PageHeader from '../../../shared/components/PageHeader';
import ConfirmDialog from '../../../shared/components/ConfirmDialog';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import { formatPrice, formatDateTime } from '../../../shared/utils/formatters';
import {
  useOrder,
  useUpdateOrderPayment,
  useUpdateOrderAddress,
  useAddOrderItem,
  useUpdateOrderItem,
  useRemoveOrderItem,
  useCancelOrder,
  useAddProductData,
} from '../api';
import api from '../../../api/axiosInstance';
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

function InfoRow({ label, value }) {
  return (
    <tr>
      <th className="align-middle text-nowrap" style={{ width: '40%' }}>{label}</th>
      <td className="align-middle">{value ?? '—'}</td>
    </tr>
  );
}

export default function OrderDetailsPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab]     = useState('items');
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [removeId, setRemoveId]       = useState(null);
  const [paidInput, setPaidInput]     = useState('');
  const [editQty, setEditQty]         = useState({});

  // Add-item state
  const [selCatId, setSelCatId]         = useState('');
  const [selSubId, setSelSubId]         = useState('');
  const [selChildId, setSelChildId]     = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [availProducts, setAvailProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [addProductId, setAddProductId] = useState('');
  const [addAttrId, setAddAttrId]       = useState('');
  const [addQty, setAddQty]             = useState(1);
  const [productAttrs, setProductAttrs] = useState([]);
  const [loadingAttrs, setLoadingAttrs] = useState(false);

  // Address form
  const [addrForm, setAddrForm] = useState({});

  const { hasPermission, isAdmin } = useAuth();
  const canEdit   = isAdmin || hasPermission('orders.edit');
  const canCancel = isAdmin || hasPermission('orders.cancel');

  const { data: order, isLoading } = useOrder(id);
  const { data: filterData }       = useAddProductData();

  const updatePayment  = useUpdateOrderPayment();
  const updateAddress  = useUpdateOrderAddress();
  const addItem        = useAddOrderItem();
  const updateItem     = useUpdateOrderItem();
  const removeItem     = useRemoveOrderItem();
  const cancelOrder    = useCancelOrder();

  const isCancelled = order?.order_status === 4;

  // Populate address form when order loads
  const addrPopulated = useRef(false);
  if (order && !addrPopulated.current) {
    addrPopulated.current = true;
    setAddrForm({
      shipping_name: order.shipping_name ?? '',
      shipping_phone: order.shipping_phone ?? '',
      shipping_email: order.shipping_email ?? '',
      shipping_address_line_1: order.shipping_address_line_1 ?? '',
      shipping_address_line_2: order.shipping_address_line_2 ?? '',
      shipping_city: order.shipping_city ?? '',
      shipping_state: order.shipping_state ?? '',
      shipping_postal_code: order.shipping_postal_code ?? '',
      billing_name: order.billing_name ?? '',
      billing_phone: order.billing_phone ?? '',
      billing_email: order.billing_email ?? '',
      billing_address_line_1: order.billing_address_line_1 ?? '',
      billing_address_line_2: order.billing_address_line_2 ?? '',
      billing_city: order.billing_city ?? '',
      billing_state: order.billing_state ?? '',
      billing_postal_code: order.billing_postal_code ?? '',
    });
    setPaidInput(String(order.paid_amount ?? ''));
    const qtyMap = {};
    (order.order_details ?? []).forEach((d) => { if (d.id != null) qtyMap[d.id] = d.quantity; });
    setEditQty(qtyMap);
  }

  // Product search for add-item
  const fetchProducts = (catId, subId, childId, search) => {
    if (!catId && !subId && !childId && !search) { setAvailProducts([]); return; }
    setLoadingProducts(true);
    const shopId = order?.shop?.id;
    const url = shopId ? `/shops/${shopId}` : '/products';
    const p = { per_page: 100, page: 1 };
    if (catId)   p.category_id = catId;
    if (subId)   p.sub_category_id = subId;
    if (childId) p.child_sub_category_id = childId;
    if (search)  p.search = search;
    api.get(url, { params: p }).then((r) => {
      const raw = r.data?.data ?? r.data;
      setAvailProducts(Array.isArray(raw?.products) ? raw.products : Array.isArray(raw) ? raw : []);
    }).catch(() => setAvailProducts([])).finally(() => setLoadingProducts(false));
  };

  const handleCatChange = (v) => {
    setSelCatId(v); setSelSubId(''); setSelChildId(''); setAvailProducts([]);
    if (v) fetchProducts(v, null, null, productSearch);
  };
  const handleSubChange = (v) => {
    setSelSubId(v); setSelChildId(''); setAvailProducts([]);
    fetchProducts(selCatId || null, v || null, null, productSearch);
  };
  const handleChildChange = (v) => {
    setSelChildId(v); setAvailProducts([]);
    fetchProducts(selCatId || null, selSubId || null, v || null, productSearch);
  };
  const handleProductSearchChange = (v) => {
    setProductSearch(v);
    if (v.length > 1) fetchProducts(selCatId || null, selSubId || null, selChildId || null, v);
  };
  const handleAddProductSelect = (v) => {
    setAddProductId(v);
    setAddAttrId('');
    setProductAttrs([]);
    if (!v) return;
    setLoadingAttrs(true);
    api.get(`/products/${v}`).then((r) => {
      const prod = r.data?.data?.product ?? r.data?.product ?? r.data?.data ?? r.data;
      setProductAttrs(Array.isArray(prod?.attributes) ? prod.attributes : []);
    }).catch(() => setProductAttrs([])).finally(() => setLoadingAttrs(false));
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!addProductId) return;
    const payload = { orderId: id, product_id: Number(addProductId), quantity: Number(addQty) };
    if (addAttrId) payload.attribute_value_id = Number(addAttrId);
    addItem.mutate(payload, {
      onSuccess: () => {
        Swal.fire({ icon: 'success', title: 'Item added', timer: 1200, showConfirmButton: false, toast: true, position: 'top-end' });
        setAddProductId(''); setAddQty(1); setAddAttrId(''); setProductAttrs([]);
      },
      onError: (err) => Swal.fire({ icon: 'error', title: err?.response?.data?.message ?? 'Failed to add item' }),
    });
  };

  const handleUpdateQty = (detailId) => {
    updateItem.mutate({ orderId: id, detailId, quantity: Number(editQty[detailId] ?? 1) }, {
      onSuccess: () => Swal.fire({ icon: 'success', title: 'Quantity updated', timer: 1000, showConfirmButton: false, toast: true, position: 'top-end' }),
      onError: (err) => Swal.fire({ icon: 'error', title: err?.response?.data?.message ?? 'Update failed' }),
    });
  };

  const handleRemoveItem = () => {
    removeItem.mutate({ orderId: id, detailId: removeId }, {
      onSuccess: () => {
        setRemoveId(null);
        Swal.fire({ icon: 'success', title: 'Item removed', timer: 1200, showConfirmButton: false, toast: true, position: 'top-end' });
      },
      onError: (err) => { setRemoveId(null); Swal.fire({ icon: 'error', title: err?.response?.data?.message ?? 'Remove failed' }); },
    });
  };

  const handleUpdatePayment = () => {
    updatePayment.mutate({ id, paid_amount: Number(paidInput) }, {
      onSuccess: () => Swal.fire({ icon: 'success', title: 'Payment updated', timer: 1200, showConfirmButton: false, toast: true, position: 'top-end' }),
      onError: (err) => Swal.fire({ icon: 'error', title: err?.response?.data?.message ?? 'Update failed' }),
    });
  };

  const handleUpdateAddress = (e) => {
    e.preventDefault();
    updateAddress.mutate({ id, ...addrForm }, {
      onSuccess: () => Swal.fire({ icon: 'success', title: 'Address updated', timer: 1200, showConfirmButton: false, toast: true, position: 'top-end' }),
      onError: (err) => Swal.fire({ icon: 'error', title: err?.response?.data?.message ?? 'Update failed' }),
    });
  };

  const handleCancel = () => {
    cancelOrder.mutate(id, {
      onSuccess: () => {
        setCancelConfirm(false);
        Swal.fire({ icon: 'success', title: 'Order cancelled', timer: 1500, showConfirmButton: false });
      },
      onError: (err) => { setCancelConfirm(false); Swal.fire({ icon: 'error', title: err?.response?.data?.message ?? 'Cancel failed' }); },
    });
  };

  const handlePrint = () => window.print();

  const addrField = (key, label) => (
    <div className="col-md-4 mt-1">
      <input
        className="form-control form-control-sm"
        placeholder={label}
        value={addrForm[key] ?? ''}
        onChange={(e) => setAddrForm((f) => ({ ...f, [key]: e.target.value }))}
      />
    </div>
  );

  // Category/Sub cascades for add-item
  const cats    = filterData?.categories ?? [];
  const allSubs = filterData?.subCategories ?? [];
  const allChild = filterData?.childSubCategories ?? [];
  const subs    = selCatId ? allSubs.filter((s) => Number(s.category_id) === Number(selCatId)) : allSubs;
  const childs  = selSubId ? allChild.filter((c) => Number(c.sub_category_id) === Number(selSubId)) : allChild;

  if (isLoading) return <LoadingSpinner />;
  if (!order) return (
    <div className="alert alert-warning">
      Order not found. <Link to="/orders">Back to Orders</Link>
    </div>
  );

  const statusMap = ORDER_STATUS_MAP[order.order_status];
  const paymentCls = PAYMENT_STATUS_CLS[order.payment_status] ?? 'bg-danger';

  return (
    <div>
      {/* Print-only invoice area (hidden on screen, shown on print) */}
      <div className="print-only">
        <h4>{order.order_number}</h4>
        <p>Customer: {order.customer?.name} | {order.customer?.phone}</p>
        <p>Date: {formatDateTime(order.created_at)}</p>
        <table className="table table-bordered">
          <thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Price</th><th>Line Total</th></tr></thead>
          <tbody>
            {(order.order_details ?? []).map((d, i) => (
              <tr key={i}>
                <td>{d.name}</td><td>{d.sku}</td><td>{d.quantity}</td>
                <td>{formatPrice(d.sell_price?.price)}</td>
                <td>{formatPrice(d.line_total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan={4} className="text-end"><strong>Total</strong></td><td><strong>{formatPrice(order.total)}</strong></td></tr>
            <tr><td colSpan={4} className="text-end">Paid</td><td>{formatPrice(order.paid_amount)}</td></tr>
            <tr><td colSpan={4} className="text-end text-danger">Due</td><td className="text-danger">{formatPrice(order.due_amount)}</td></tr>
          </tfoot>
        </table>
      </div>

      <PageHeader
        title={order.order_number}
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Orders', to: '/orders' }, { label: order.order_number }]}
        actionLabel="Back to Orders"
        actionTo="/orders"
        actionIcon="fa-arrow-left"
      />

      {/* Status strip */}
      <div className="d-flex flex-wrap gap-2 align-items-center mb-3 no-print">
        <span className={`badge fs-6 ${statusMap?.cls ?? 'bg-secondary'}`}>{order.order_status_string}</span>
        <span className={`badge fs-6 ${paymentCls}`}>{order.payment_status}</span>
        <div className="ms-auto d-flex gap-2">
          <button className="btn btn-sm btn-outline-secondary" onClick={handlePrint}>
            <i className="fa-solid fa-print me-1" /> Print Invoice
          </button>
          {!isCancelled && canCancel && (
            <button className="btn btn-sm btn-outline-danger" onClick={() => setCancelConfirm(true)}>
              <i className="fa-solid fa-ban me-1" /> Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Customer + Shop row */}
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header py-2"><strong>Customer</strong></div>
            <div className="card-body p-0">
              <table className="table table-sm table-bordered mb-0">
                <tbody>
                  <InfoRow label="Name"  value={order.customer?.name} />
                  <InfoRow label="Phone" value={order.customer?.phone} />
                  <InfoRow label="Email" value={order.customer?.email} />
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header py-2"><strong>Shop / Branch</strong></div>
            <div className="card-body p-0">
              <table className="table table-sm table-bordered mb-0">
                <tbody>
                  <InfoRow label="Shop"          value={order.shop?.name} />
                  <InfoRow label="Sales Manager" value={order.sales_manager?.name} />
                  <InfoRow label="Order Date"    value={formatDateTime(order.created_at)} />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="card mb-3">
        <div className="card-header py-2"><strong>Order Summary</strong></div>
        <div className="card-body p-0">
          <table className="table table-sm table-bordered mb-0">
            <tbody>
              <tr>
                <th>Order Number</th><td><strong>{order.order_number}</strong></td>
                <th>Total Items</th><td><strong>{order.quantity}</strong></td>
              </tr>
              <tr>
                <th>Payment Method</th><td>{order.payment_method?.name ?? '—'}</td>
                <th>Account #</th><td>{order.payment_method?.account_number ?? '—'}</td>
              </tr>
              <tr>
                <th>Sub Total</th><td>{formatPrice(order.sub_total)}</td>
                <th>Discount</th><td>{formatPrice(order.discount)}</td>
              </tr>
              <tr>
                <th>Total</th><td><strong>{formatPrice(order.total)}</strong></td>
                <th>Paid</th><td><span className="text-success fw-semibold">{formatPrice(order.paid_amount)}</span></td>
              </tr>
              <tr>
                <th>Due</th><td><span className="text-danger fw-semibold">{formatPrice(order.due_amount)}</span></td>
                <th>Last Updated</th><td><small className="text-muted">{formatDateTime(order.updated_at)}</small></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-3 no-print">
        {[
          { key: 'items',    label: 'Order Items' },
          { key: 'payment',  label: 'Payment' },
          { key: 'address',  label: 'Address' },
          { key: 'history',  label: 'History' },
        ].map((t) => (
          <li key={t.key} className="nav-item">
            <button
              className={`nav-link ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Tab: Items */}
      {activeTab === 'items' && (
        <div>
          <div className="card mb-3">
            <div className="card-header py-2 d-flex justify-content-between align-items-center">
              <strong>Order Items</strong>
              {!isCancelled && <small className="text-muted">Edit quantity → click Update per row</small>}
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-sm table-bordered table-hover mb-0">
                  <thead>
                    <tr>
                      <th>SL</th><th>Product</th><th>Attribute</th>
                      <th>Qty</th><th>Photo</th><th>Unit Price</th>
                      <th className="text-end">Line Total</th>
                      {!isCancelled && canEdit && <th>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(order.order_details ?? []).map((d, i) => (
                      <tr key={d.id ?? i}>
                        <td>{i + 1}</td>
                        <td>
                          <div className="fw-semibold">{d.name}</div>
                          <small className="text-muted">SKU: {d.sku}</small>
                          {d.supplier && <div><small>Supplier: {d.supplier}</small></div>}
                        </td>
                        <td>{d.attribute || '—'}</td>
                        <td>
                          {!isCancelled && canEdit ? (
                            <div className="d-flex gap-1 align-items-center">
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                style={{ width: 60 }}
                                min={1}
                                value={editQty[d.id] ?? d.quantity}
                                onChange={(e) => setEditQty((q) => ({ ...q, [d.id]: e.target.value }))}
                              />
                              <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => handleUpdateQty(d.id)}
                                disabled={updateItem.isPending}
                              >
                                {updateItem.isPending ? '…' : 'Update'}
                              </button>
                            </div>
                          ) : d.quantity}
                        </td>
                        <td>
                          {d.photo && (
                            <img src={d.photo} alt="" width={40} height={40} style={{ objectFit: 'cover', borderRadius: 4 }} />
                          )}
                        </td>
                        <td>{formatPrice(d.sell_price?.price)}</td>
                        <td className="text-end">{formatPrice(d.line_total ?? (Number(d.sell_price?.price ?? 0) * Number(d.quantity ?? 0)))}</td>
                        {!isCancelled && canEdit && (
                          <td>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => setRemoveId(d.id)}
                              disabled={removeItem.isPending}
                            >
                              Remove
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={!isCancelled && canEdit ? 6 : 5} className="text-end fw-bold">Total</td>
                      <td className="text-end fw-bold">{formatPrice(order.total)}</td>
                      {!isCancelled && canEdit && <td />}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Add item */}
          {!isCancelled && canEdit && (
            <div className="card">
              <div className="card-header py-2"><strong>Add Item to Order</strong></div>
              <div className="card-body">
                <form onSubmit={handleAddItem} className="row g-2 align-items-end">
                  <div className="col-sm-3">
                    <label className="form-label small mb-1">Category</label>
                    <select className="form-select form-select-sm" value={selCatId} onChange={(e) => handleCatChange(e.target.value)}>
                      <option value="">Select category</option>
                      {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="col-sm-3">
                    <label className="form-label small mb-1">Sub Category</label>
                    <select className="form-select form-select-sm" value={selSubId} onChange={(e) => handleSubChange(e.target.value)} disabled={!selCatId}>
                      <option value="">Select sub category</option>
                      {subs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="col-sm-3">
                    <label className="form-label small mb-1">Child Sub Category</label>
                    <select className="form-select form-select-sm" value={selChildId} onChange={(e) => handleChildChange(e.target.value)} disabled={!selSubId}>
                      <option value="">Select child sub cat</option>
                      {childs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="col-sm-3">
                    <label className="form-label small mb-1">Search SKU / Name</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Type to search…"
                      value={productSearch}
                      onChange={(e) => handleProductSearchChange(e.target.value)}
                    />
                  </div>
                  <div className="col-sm-4">
                    <label className="form-label small mb-1">Product {loadingProducts && <span className="spinner-border spinner-border-sm ms-1" />}</label>
                    <select className="form-select form-select-sm" value={addProductId} onChange={(e) => handleAddProductSelect(e.target.value)}>
                      <option value="">Select product</option>
                      {availProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sku ? `[${p.sku}] ` : ''}{p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {productAttrs.length > 0 && (
                    <div className="col-sm-3">
                      <label className="form-label small mb-1">Attribute {loadingAttrs && <span className="spinner-border spinner-border-sm ms-1" />}</label>
                      <select className="form-select form-select-sm" value={addAttrId} onChange={(e) => setAddAttrId(e.target.value)}>
                        <option value="">— None —</option>
                        {productAttrs.map((a) => {
                          const vid = a.value_id ?? a.attribute_value_id ?? a.value?.id;
                          if (vid == null) return null;
                          return (
                            <option key={a.id ?? vid} value={String(vid)}>
                              {[a.attribute_name || a.attribute?.name, a.attribute_value || a.value?.name].filter(Boolean).join(': ')}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}
                  <div className="col-sm-2">
                    <label className="form-label small mb-1">Qty</label>
                    <input type="number" className="form-control form-control-sm" min={1} value={addQty} onChange={(e) => setAddQty(e.target.value)} />
                  </div>
                  <div className="col-auto">
                    <button type="submit" className="btn btn-primary btn-sm" disabled={!addProductId || addItem.isPending}>
                      {addItem.isPending ? 'Adding…' : 'Add Item'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Payment */}
      {activeTab === 'payment' && (
        <div>
          {!isCancelled && canEdit && (
            <div className="card mb-3">
              <div className="card-header py-2"><strong>Update Payment</strong></div>
              <div className="card-body">
                <div className="row align-items-end g-2">
                  <div className="col-sm-3">
                    <label className="form-label small">Paid Amount</label>
                    <input type="number" className="form-control" min={0} value={paidInput} onChange={(e) => setPaidInput(e.target.value)} />
                  </div>
                  <div className="col-sm-2">
                    <label className="form-label small">Total</label>
                    <div className="form-control-plaintext">{formatPrice(order.total)}</div>
                  </div>
                  <div className="col-sm-2">
                    <label className="form-label small">Due</label>
                    <div className="form-control-plaintext text-danger">
                      {formatPrice(Math.max(0, (order.total ?? 0) - Number(paidInput || 0)))}
                    </div>
                  </div>
                  <div className="col-auto">
                    <button className="btn btn-primary" onClick={handleUpdatePayment} disabled={updatePayment.isPending}>
                      {updatePayment.isPending ? 'Saving…' : 'Update Payment'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transactions */}
          <div className="card">
            <div className="card-header py-2"><strong>Transactions</strong></div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-sm table-bordered mb-0">
                  <thead>
                    <tr>
                      <th>Trx ID</th><th>Amount</th><th>Customer</th>
                      <th>Payment</th><th>Status</th><th>By</th><th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.transactions ?? []).length === 0 ? (
                      <tr><td colSpan={7} className="text-center text-muted py-3">No transactions yet.</td></tr>
                    ) : (
                      (order.transactions ?? []).map((t, i) => (
                        <tr key={i}>
                          <td>{t.trx_id}</td>
                          <td>{formatPrice(t.amount)}</td>
                          <td><div>{t.customer_name}</div><small>{t.customer_phone}</small></td>
                          <td><div>{t.payment_method_name}</div><small>{t.account_number}</small></td>
                          <td><div>{t.status}</div><small>{t.transaction_type}</small></td>
                          <td>{t.transaction_by}</td>
                          <td><small className="text-muted">{formatDateTime(t.created_at)}</small></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Address */}
      {activeTab === 'address' && (
        <div className="card">
          <div className="card-header py-2"><strong>Shipping &amp; Billing Address</strong></div>
          <div className="card-body">
            <form onSubmit={handleUpdateAddress}>
              <div className="mb-3">
                <h6 className="fw-semibold">Shipping</h6>
                <div className="row">
                  {addrField('shipping_name',           'Name')}
                  {addrField('shipping_phone',          'Phone')}
                  {addrField('shipping_email',          'Email')}
                  {addrField('shipping_address_line_1', 'Address Line 1')}
                  {addrField('shipping_address_line_2', 'Address Line 2')}
                  {addrField('shipping_city',           'City')}
                  {addrField('shipping_state',          'State')}
                  {addrField('shipping_postal_code',    'Postal Code')}
                </div>
              </div>
              <div className="mb-3">
                <h6 className="fw-semibold">Billing</h6>
                <div className="row">
                  {addrField('billing_name',           'Name')}
                  {addrField('billing_phone',          'Phone')}
                  {addrField('billing_email',          'Email')}
                  {addrField('billing_address_line_1', 'Address Line 1')}
                  {addrField('billing_address_line_2', 'Address Line 2')}
                  {addrField('billing_city',           'City')}
                  {addrField('billing_state',          'State')}
                  {addrField('billing_postal_code',    'Postal Code')}
                </div>
              </div>
              {canEdit && (
                <button type="submit" className="btn btn-primary btn-sm" disabled={updateAddress.isPending}>
                  {updateAddress.isPending ? 'Saving…' : 'Update Address'}
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Tab: History */}
      {activeTab === 'history' && (
        <div className="card">
          <div className="card-header py-2"><strong>Activity History</strong></div>
          <div className="card-body p-0">
            {(order.history ?? []).length === 0 ? (
              <div className="text-muted p-3">No history yet.</div>
            ) : (
              <table className="table table-sm table-bordered mb-0">
                <thead>
                  <tr><th>Time</th><th>Action</th><th>Description</th></tr>
                </thead>
                <tbody>
                  {order.history.map((h) => (
                    <tr key={h.id}>
                      <td><small>{formatDateTime(h.created_at)}</small></td>
                      <td>{String(h.action ?? '').replace(/_/g, ' ')}</td>
                      <td>{h.description ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Cancel confirm */}
      <ConfirmDialog
        show={cancelConfirm}
        title="Cancel this order?"
        message="Stock will be restored. This cannot be undone."
        confirmLabel="Cancel Order"
        isLoading={cancelOrder.isPending}
        onConfirm={handleCancel}
        onCancel={() => setCancelConfirm(false)}
      />

      {/* Remove item confirm */}
      <ConfirmDialog
        show={Boolean(removeId)}
        title="Remove item from order?"
        message="This will update the order total."
        confirmLabel="Remove"
        isLoading={removeItem.isPending}
        onConfirm={handleRemoveItem}
        onCancel={() => setRemoveId(null)}
      />
    </div>
  );
}
