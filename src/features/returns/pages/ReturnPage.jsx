import { useState } from 'react';
import Swal from 'sweetalert2';
import PageHeader from '../../../shared/components/PageHeader';
import { SkeletonTable } from '../../../shared/components/Skeleton';
import { useShopListForTransfer } from '../../inventory/api';
import { useReturnSearch, useReturnOrderDetail, useSubmitReturn } from '../api';

const toast = (icon, title) =>
  Swal.fire({ toast: true, position: 'top-end', icon, title, timer: 1400, showConfirmButton: false });

export default function ReturnPage() {
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null); // { id, type, order_number, customer, shop, total, created_at }
  const [returnItems, setReturnItems]     = useState([]);   // { detail_id, name, sku, unit_price, quantity }
  const [returnShop, setReturnShop]       = useState('');

  // ── Data ─────────────────────────────────────────────────────────────
  const { data: searchRes, isFetching: searching } = useReturnSearch(searchQuery);
  const orderList = searchRes?.data ?? [];

  const { data: orderDetail, isFetching: loadingDetail } = useReturnOrderDetail(
    selectedOrder?.type,
    selectedOrder?.id,
  );
  const orderItems = orderDetail?.items ?? [];

  const { data: shops = [] }        = useShopListForTransfer();
  const { mutate: submit, isPending } = useSubmitReturn();

  // ── Search ───────────────────────────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) return toast('warning', 'Enter a phone number or order ID');
    setSelectedOrder(null);
    setReturnItems([]);
    setSearchQuery(q);
  };

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setReturnItems([]);
  };

  // ── Item management ──────────────────────────────────────────────────
  const isSelected   = (detail_id) => returnItems.some((i) => i.detail_id === detail_id);

  const toggleItem = (item) => {
    if (isSelected(item.detail_id)) {
      setReturnItems((prev) => prev.filter((i) => i.detail_id !== item.detail_id));
    } else {
      setReturnItems((prev) => [...prev, { ...item, quantity: 1 }]);
    }
  };

  const setQty = (detail_id, qty) => {
    const src = orderItems.find((i) => i.detail_id === detail_id);
    const clamped = Math.min(Math.max(1, qty), src?.max_return ?? 1);
    setReturnItems((prev) =>
      prev.map((i) => (i.detail_id === detail_id ? { ...i, quantity: clamped } : i)),
    );
  };

  // ── Summary ──────────────────────────────────────────────────────────
  const totalQty    = returnItems.reduce((s, i) => s + i.quantity, 0);
  const totalAmount = returnItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);

  // ── Submit ───────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!selectedOrder)       return toast('warning', 'Select an order first');
    if (!returnItems.length)  return toast('warning', 'Select at least one item to return');
    if (!returnShop)          return toast('warning', 'Select a return-to branch');

    const shopName = shops.find((s) => String(s.id ?? s.shop_id) === String(returnShop))?.name ?? returnShop;

    Swal.fire({
      title: 'Confirm Return?',
      text: `Order ${selectedOrder.order_number} — ${totalQty} pcs (৳${totalAmount.toLocaleString()}) → ${shopName}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Submit Return',
      confirmButtonColor: '#d33',
    }).then((result) => {
      if (!result.isConfirmed) return;
      submit(
        {
          order_type:        selectedOrder.type,
          order_id:          selectedOrder.id,
          return_to_shop_id: Number(returnShop),
          items: returnItems.map(({ detail_id, quantity }) => ({ detail_id, quantity })),
        },
        {
          onSuccess: (res) => {
            toast(res?.status ?? 'success', res?.message ?? 'Return submitted successfully');
            setSelectedOrder(null);
            setReturnItems([]);
            setReturnShop('');
            setSearchInput('');
            setSearchQuery('');
          },
          onError: (err) => {
            toast('error', err?.response?.data?.message ?? 'Return failed');
          },
        },
      );
    });
  };

  return (
    <div>
      <PageHeader
        title="Order Returns"
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Returns' }]}
        actionLabel="Return Log"
        actionTo="/return/log"
        actionIcon="fa-solid fa-list"
      />

      {/* ── Search ─────────────────────────────────────────────────── */}
      <div className="card mb-3">
        <div className="card-body">
          <form onSubmit={handleSearch}>
            <div className="row g-2 align-items-end">
              <div className="col">
                <label className="form-label text-muted small mb-1">Search by phone number or order ID</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fa-solid fa-magnifying-glass" /></span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 01711000001 or ORD-101"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-auto">
                <button type="submit" className="btn btn-primary" disabled={searching}>
                  {searching
                    ? <><span className="spinner-border spinner-border-sm me-1" />Searching…</>
                    : <><i className="fa-solid fa-search me-1" />Search</>}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* ── Search results list ─────────────────────────────────────── */}
      {searchQuery && !searching && orderList.length === 0 && (
        <div className="card mb-3">
          <div className="card-body text-center py-4 text-muted">
            <i className="fa-solid fa-magnifying-glass fa-2x mb-2 d-block opacity-25" />
            No orders found for <strong>{searchQuery}</strong>
          </div>
        </div>
      )}

      {orderList.length > 0 && !selectedOrder && (
        <div className="card mb-3">
          <div className="card-header py-2 fw-semibold">
            {orderList.length} order{orderList.length > 1 ? 's' : ''} found — select one to continue
          </div>
          <div className="card-body p-0">
            <table className="table table-sm table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Order</th>
                  <th>Type</th>
                  <th>Customer</th>
                  <th>Branch</th>
                  <th className="text-end">Total</th>
                  <th>Date</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {orderList.map((o) => (
                  <tr key={`${o.type}-${o.id}`} style={{ cursor: 'pointer' }} onClick={() => handleSelectOrder(o)}>
                    <td>
                      <strong>{o.order_number}</strong>
                      {o.has_return && (
                        <span className="badge bg-warning text-dark ms-2" style={{ fontSize: '0.65rem' }}>Prior return</span>
                      )}
                    </td>
                    <td><span className="badge bg-secondary">{o.type}</span></td>
                    <td>
                      <div>{o.customer?.name ?? '—'}</div>
                      <small className="text-muted">{o.customer?.phone}</small>
                    </td>
                    <td>{o.shop?.name ?? '—'}</td>
                    <td className="text-end">৳{Number(o.total ?? 0).toLocaleString()}</td>
                    <td className="text-muted small">{o.created_at ? o.created_at.slice(0, 10) : '—'}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary">Select</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Selected order detail ───────────────────────────────────── */}
      {selectedOrder && (
        <>
          {/* Order summary strip */}
          <div className="card mb-3 border-primary">
            <div className="card-body py-2">
              <div className="d-flex flex-wrap gap-4 align-items-center">
                <div>
                  <small className="text-muted d-block">Order</small>
                  <strong>{selectedOrder.order_number}</strong>
                  <span className="badge bg-secondary ms-2">{selectedOrder.type}</span>
                  {selectedOrder.has_return && (
                    <span className="badge bg-warning text-dark ms-1">Prior return</span>
                  )}
                </div>
                {selectedOrder.customer?.name && (
                  <div>
                    <small className="text-muted d-block">Customer</small>
                    <strong>{selectedOrder.customer.name}</strong>
                    <small className="text-muted ms-2">{selectedOrder.customer.phone}</small>
                  </div>
                )}
                <div>
                  <small className="text-muted d-block">Branch</small>
                  <strong>{selectedOrder.shop?.name ?? '—'}</strong>
                </div>
                <div>
                  <small className="text-muted d-block">Order Total</small>
                  <strong>৳{Number(selectedOrder.total ?? 0).toLocaleString()}</strong>
                </div>
                <div className="ms-auto">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => { setSelectedOrder(null); setReturnItems([]); }}
                  >
                    <i className="fa-solid fa-arrow-left me-1" />Back to results
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Two-panel layout */}
          {loadingDetail ? (
            <SkeletonTable rows={4} cols={5} />
          ) : (
            <div className="row g-3">
              {/* Left — Ordered Items */}
              <div className="col-lg-6">
                <div className="card h-100">
                  <div className="card-header d-flex justify-content-between align-items-center py-2">
                    <span className="fw-semibold">
                      <i className="fa-solid fa-box me-2 text-muted" />Ordered Items
                    </span>
                    <span className="badge bg-secondary">{orderItems.length} items</span>
                  </div>
                  <div className="card-body p-0">
                    <table className="table table-sm table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: 40 }} />
                          <th>Product</th>
                          <th className="text-center">Ordered</th>
                          <th className="text-center">Returnable</th>
                          <th className="text-end">Unit Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderItems.map((item) => {
                          const selected = isSelected(item.detail_id);
                          return (
                            <tr
                              key={item.detail_id}
                              className={selected ? 'table-primary' : ''}
                              style={{ cursor: item.max_return > 0 ? 'pointer' : 'default' }}
                              onClick={() => item.max_return > 0 && toggleItem(item)}
                            >
                              <td className="text-center">
                                {item.max_return > 0 ? (
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={selected}
                                    onChange={() => toggleItem(item)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  <i className="fa-solid fa-ban text-muted" title="Already fully returned" />
                                )}
                              </td>
                              <td>
                                <div className="fw-semibold small">{item.name}</div>
                                <small className="text-muted">{item.sku}</small>
                              </td>
                              <td className="text-center">{item.quantity}</td>
                              <td className="text-center">
                                {item.max_return > 0 ? (
                                  <span className="badge bg-success">{item.max_return}</span>
                                ) : (
                                  <span className="badge bg-secondary">0</span>
                                )}
                              </td>
                              <td className="text-end">৳{Number(item.unit_price).toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="card-footer py-2">
                    <small className="text-muted">Click a row to add it to the return list.</small>
                  </div>
                </div>
              </div>

              {/* Right — Return Items */}
              <div className="col-lg-6">
                <div className="card h-100">
                  <div className="card-header d-flex justify-content-between align-items-center py-2">
                    <span className="fw-semibold">
                      <i className="fa-solid fa-rotate-left me-2 text-danger" />Items to Return
                    </span>
                    <span className="badge bg-danger">{returnItems.length} selected</span>
                  </div>
                  <div className="card-body p-0">
                    {returnItems.length === 0 ? (
                      <div className="text-center text-muted py-5">
                        <i className="fa-solid fa-arrow-left fa-2x mb-2 d-block opacity-25" />
                        Select items from the left panel
                      </div>
                    ) : (
                      <table className="table table-sm table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Product</th>
                            <th className="text-center" style={{ width: 110 }}>Qty</th>
                            <th className="text-end">Subtotal</th>
                            <th style={{ width: 40 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {returnItems.map((item) => {
                            const src = orderItems.find((i) => i.detail_id === item.detail_id);
                            return (
                              <tr key={item.detail_id}>
                                <td>
                                  <div className="fw-semibold small">{item.name}</div>
                                  <small className="text-muted">{item.sku}</small>
                                </td>
                                <td className="text-center">
                                  <div className="input-group input-group-sm" style={{ width: 100 }}>
                                    <button
                                      className="btn btn-outline-secondary"
                                      type="button"
                                      onClick={() => setQty(item.detail_id, item.quantity - 1)}
                                      disabled={item.quantity <= 1}
                                    >−</button>
                                    <input
                                      type="number"
                                      className="form-control text-center px-1"
                                      value={item.quantity}
                                      min={1}
                                      max={src?.max_return ?? 1}
                                      onChange={(e) => setQty(item.detail_id, Number(e.target.value))}
                                    />
                                    <button
                                      className="btn btn-outline-secondary"
                                      type="button"
                                      onClick={() => setQty(item.detail_id, item.quantity + 1)}
                                      disabled={item.quantity >= (src?.max_return ?? 1)}
                                    >+</button>
                                  </div>
                                </td>
                                <td className="text-end">৳{(item.quantity * item.unit_price).toLocaleString()}</td>
                                <td>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => toggleItem(item)}
                                  >
                                    <i className="fa-solid fa-xmark" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="card-footer">
                    <div className="mb-3">
                      <label className="form-label mb-1 small fw-semibold">
                        Return to Branch <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select form-select-sm"
                        value={returnShop}
                        onChange={(e) => setReturnShop(e.target.value)}
                      >
                        <option value="">Select branch…</option>
                        {shops.map((s) => (
                          <option key={s.id ?? s.shop_id} value={s.id ?? s.shop_id}>
                            {s.name ?? s.shop_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {returnItems.length > 0 && (
                      <div className="d-flex justify-content-between mb-3 small">
                        <span className="text-muted">Total qty: <strong>{totalQty} pcs</strong></span>
                        <span className="text-muted">Total: <strong>৳{totalAmount.toLocaleString()}</strong></span>
                      </div>
                    )}

                    <button
                      className="btn btn-danger w-100"
                      onClick={handleSubmit}
                      disabled={isPending || !returnItems.length}
                    >
                      {isPending
                        ? <><span className="spinner-border spinner-border-sm me-1" />Submitting…</>
                        : <><i className="fa-solid fa-rotate-left me-1" />Submit Return</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Empty state ─────────────────────────────────────────────── */}
      {!searchQuery && (
        <div className="card">
          <div className="card-body text-center py-5 text-muted">
            <i className="fa-solid fa-rotate-left fa-3x mb-3 d-block opacity-25" />
            <p className="mb-0">Search for an order above to begin processing a return.</p>
          </div>
        </div>
      )}
    </div>
  );
}
