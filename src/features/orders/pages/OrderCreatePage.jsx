import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Modal } from 'react-bootstrap';
import PageHeader from '../../../shared/components/PageHeader';
import { formatPrice } from '../../../shared/utils/formatters';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { useAuth } from '../../../shared/hooks/useAuth';
import {
  useShopList,
  useShopProducts,
  usePaymentMethods,
  useSalesManagers,
  useCustomers,
  useCreateCustomer,
  useCreateStoreOrder,
} from '../api';

const EMPTY_CUSTOMER = { name: '', phone: '', email: '' };
const EMPTY_SUMMARY = {
  items: 0, amount: 0, discount: 0, payable: 0, paid: 0, due: 0,
  payment_method_id: '', trx_id: '', sales_manager_id: '',
};

export default function OrderCreatePage() {
  const navigate = useNavigate();
  const { assignedShopId: rawAssignedShopId, isLoading: authLoading } = useAuth();
  const assignedShopId = rawAssignedShopId ? String(rawAssignedShopId) : null;

  const [selectedShop,   setSelectedShop]   = useState('');
  const [productSearch,  setProductSearch]  = useState('');
  const [cartItems,      setCartItems]      = useState([]);
  const [summary,        setSummary]        = useState(EMPTY_SUMMARY);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showAttrModal,  setShowAttrModal]  = useState(false);
  const [attrProduct,    setAttrProduct]    = useState(null);
  const [selectedAttr,   setSelectedAttr]   = useState('');
  const [attrError,      setAttrError]      = useState(false);
  const [showConfirm,    setShowConfirm]    = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer,    setNewCustomer]    = useState(EMPTY_CUSTOMER);

  const debouncedSearch = useDebounce(productSearch, 400);
  const debouncedCust   = useDebounce(customerSearch, 400);

  const { data: shops = [] }          = useShopList();
  const { data: paymentMethods = [] } = usePaymentMethods();
  const { data: salesManagers = [] }  = useSalesManagers();

  const { data: products = [], isLoading: loadingProducts } = useShopProducts(
    selectedShop,
    { page: 1, per_page: 50, search: debouncedSearch, order_by: 'id', direction: 'asc' }
  );

  const { data: customersData, isLoading: loadingCustomers } = useCustomers(
    debouncedCust ? { search: debouncedCust, per_page: 20 } : null
  );
  const customers = customersData?.data ?? customersData ?? [];

  const createStoreOrder = useCreateStoreOrder();
  const createCustomer   = useCreateCustomer();

  // Auto-select assigned branch once auth + shops are ready
  useEffect(() => {
    if (assignedShopId && shops.length > 0) {
      setSelectedShop(assignedShopId);
    }
  }, [assignedShopId, shops]);

  // Recalculate summary whenever cartItems changes
  useEffect(() => {
    let items = 0, amount = 0, discount = 0, payable = 0;
    cartItems.forEach((c) => {
      items   += c.quantity;
      amount  += (c.original_price ?? 0) * c.quantity;
      discount+= (c.discount_price ?? 0) * c.quantity;
      payable += (c.price ?? 0) * c.quantity;
    });
    setSummary((s) => ({ ...s, items, amount, discount, payable, paid: 0, due: payable }));
  }, [cartItems]);

  const addToCart = (product, attrId = 0, attrName = '', price = null, discountPrice = 0) => {
    const key = `${product.id}-${attrId}`;
    setCartItems((prev) => {
      const existing = prev.findIndex((c) => c.key === key);
      if (existing !== -1) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], quantity: updated[existing].quantity + 1 };
        return updated;
      }
      return [...prev, {
        key,
        productId:     product.id,
        attributesId:  attrId,
        name:          product.name,
        attribute_name: attrName,
        original_price: product.original_price ?? product.price ?? 0,
        price:         price ?? product.sell_price?.price ?? product.price ?? 0,
        discount_price: discountPrice,
        sku:           product.sku,
        in_stock:      product.stock,
        image:         product.primary_photo,
        quantity:      1,
      }];
    });
  };

  const handleAddProduct = (product) => {
    if (product.attributes?.length > 0) {
      setAttrProduct(product);
      setSelectedAttr('');
      setAttrError(false);
      setShowAttrModal(true);
    } else {
      addToCart(product);
    }
  };

  const handleConfirmAttr = () => {
    if (!selectedAttr) { setAttrError(true); return; }
    const attr = attrProduct.attributes.find((a) => String(a.id) === String(selectedAttr));
    let price = attrProduct.sell_price?.price ?? attrProduct.price ?? 0;
    const attrName = attr ? `${attr.attribute_name ?? ''} ${attr.attribute_value ?? ''}`.trim() : '';
    if (attr?.math_sign === '+') price += Number(attr.number ?? 0);
    else if (attr?.math_sign === '-') price -= Number(attr.number ?? 0);
    else if (attr?.math_sign === '*') price *= Number(attr.number ?? 1);
    addToCart(attrProduct, attr?.id, attrName, price, attrProduct.sell_price?.discount ?? 0);
    setShowAttrModal(false);
    setAttrProduct(null);
  };

  const adjustQty = (key, delta) => {
    setCartItems((prev) =>
      prev.map((c) => c.key === key
        ? { ...c, quantity: Math.max(1, Math.min(c.in_stock ?? 999, c.quantity + delta)) }
        : c
      ).filter((c) => c.quantity > 0)
    );
  };

  const removeFromCart = (key) => setCartItems((prev) => prev.filter((c) => c.key !== key));

  const handlePaidChange = (v) => {
    const paid = Math.min(Number(v) || 0, summary.payable);
    setSummary((s) => ({ ...s, paid, due: s.payable - paid }));
  };

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) { Swal.fire({ icon: 'warning', title: 'Cart is empty', timer: 1500, showConfirmButton: false }); return; }
    if (!selectedShop)          { Swal.fire({ icon: 'warning', title: 'Select a branch first', timer: 1500, showConfirmButton: false }); return; }
    if (!selectedCustomer)      { Swal.fire({ icon: 'warning', title: 'Select a customer first', timer: 1500, showConfirmButton: false }); return; }
    setShowConfirm(true);
  };

  const handleSubmitOrder = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const created_at = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const payload = {
      shop_id: Number(selectedShop),
      created_by: summary.sales_manager_id ? Number(summary.sales_manager_id) : null,
      created_at,
      carts: cartItems.map((c) => ({
        productId: c.productId,
        quantity:  c.quantity,
        meta: {
          attributesId:  c.attributesId,
          attribute_name: c.attribute_name,
          original_price: c.original_price,
          price:         c.price,
          discount_price: c.discount_price,
          sku:           c.sku,
        },
      })),
      order_summary: {
        customer_number: selectedCustomer?.phone ?? null,
        subtotal:        summary.amount,
        discount_amount: summary.discount,
        tax_amount:      0,
        total_amount:    summary.payable,
        paid_amount:     summary.paid,
        due_amount:      summary.due,
        payment_method_id: summary.payment_method_id || null,
        status: 'completed',
        notes: summary.trx_id || 'store counter sale',
      },
    };

    createStoreOrder.mutate(payload, {
      onSuccess: (res) => {
        setShowConfirm(false);
        Swal.fire({ icon: 'success', title: 'Order placed!', timer: 1500, showConfirmButton: false });
        if (res?.order?.id) navigate(`/store-order/${res.order.id}`);
      },
      onError: (err) => {
        setShowConfirm(false);
        Swal.fire({ icon: 'error', title: err?.response?.data?.message ?? 'Failed to place order' });
      },
    });
  };

  const handleCreateCustomer = () => {
    if (!newCustomer.name || !newCustomer.phone) {
      Swal.fire({ icon: 'warning', title: 'Name and phone are required', timer: 1500, showConfirmButton: false });
      return;
    }
    createCustomer.mutate(newCustomer, {
      onSuccess: (res) => {
        const created = res?.data ?? res;
        setSelectedCustomer(created);
        setShowAddCustomer(false);
        setNewCustomer(EMPTY_CUSTOMER);
        Swal.fire({ icon: 'success', title: 'Customer added', timer: 1200, showConfirmButton: false, toast: true, position: 'top-end' });
      },
      onError: (err) => Swal.fire({ icon: 'error', title: err?.response?.data?.message ?? 'Failed to create customer' }),
    });
  };

  return (
    <div>
      <PageHeader
        title="Create Order"
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Orders', to: '/orders' }, { label: 'Create' }]}
        actionLabel="Store Orders"
        actionTo="/store-orders"
        actionIcon="fa-list"
      />

      <div className="row g-3">
        {/* ── Left: Product Panel ── */}
        <div className="col-md-5">
          <div className="card h-100">
            <div className="card-header py-2 d-flex align-items-center gap-2">
              <strong>Products</strong>
              {assignedShopId ? (
                <span className="ms-auto small text-muted d-flex align-items-center gap-1">
                  <i className="fa-solid fa-lock" style={{ fontSize: 11 }} />
                  {shops.find((s) => String(s.id) === assignedShopId)?.name ?? 'Your branch'}
                </span>
              ) : (
                <select
                  className="form-select form-select-sm ms-auto"
                  style={{ maxWidth: 200 }}
                  value={selectedShop}
                  onChange={(e) => { setSelectedShop(e.target.value); setCartItems([]); setProductSearch(''); }}
                  disabled={authLoading}
                >
                  <option value="">Select branch first</option>
                  {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
            </div>

            {selectedShop ? (
              <div className="card-body p-2">
                <div className="input-group mb-2">
                  <span className="input-group-text"><i className="fa-solid fa-magnifying-glass" /></span>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search by name or SKU…"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>

                {loadingProducts ? (
                  <div className="text-center py-3">
                    <span className="spinner-border spinner-border-sm text-primary" />
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-muted text-center py-3 small">No products found.</div>
                ) : (
                  <div style={{ maxHeight: 480, overflowY: 'auto' }}>
                    {products.map((p) => (
                      <div key={p.id} className="d-flex align-items-center gap-2 p-2 border-bottom">
                        {p.primary_photo && (
                          <img src={p.primary_photo} alt={p.name} width={42} height={42} style={{ objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                        )}
                        <div className="flex-grow-1 overflow-hidden">
                          <div className="fw-semibold text-truncate small">{p.name}</div>
                          <div className="text-muted" style={{ fontSize: 11 }}>
                            SKU: {p.sku} | Stock: {p.stock} | {formatPrice(p.sell_price?.price ?? p.price)}
                          </div>
                        </div>
                        <button
                          className="btn btn-sm btn-success flex-shrink-0"
                          onClick={() => handleAddProduct(p)}
                          disabled={!p.stock || p.stock < 1}
                          title="Add to cart"
                        >
                          <i className="fa-solid fa-plus" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="card-body text-center text-muted py-5">
                <i className="fa-solid fa-store fa-2x mb-2 d-block" />
                Select a branch to view products
              </div>
            )}
          </div>
        </div>

        {/* ── Center: Cart ── */}
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-header py-2">
              <strong>Cart</strong>
              {cartItems.length > 0 && (
                <span className="badge bg-primary ms-2">{cartItems.length}</span>
              )}
            </div>
            <div className="card-body p-2">
              {/* Order summary */}
              <table className="table table-sm table-bordered mb-2">
                <tbody>
                  <tr><th>Items</th><td className="text-end">{summary.items}</td></tr>
                  <tr><th>Price</th><td className="text-end">{formatPrice(summary.amount)}</td></tr>
                  <tr><th>Discount</th><td className="text-end text-success">- {formatPrice(summary.discount)}</td></tr>
                  <tr><th>Payable</th><td className="text-end fw-bold">{formatPrice(summary.payable)}</td></tr>
                </tbody>
              </table>

              {/* Cart items */}
              {cartItems.length === 0 ? (
                <div className="text-muted text-center py-3 small">Cart is empty</div>
              ) : (
                <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                  {cartItems.map((item) => (
                    <div key={item.key} className="d-flex align-items-center gap-2 p-2 border-bottom">
                      {item.image && (
                        <img src={item.image} alt={item.name} width={36} height={36} style={{ objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                      )}
                      <div className="flex-grow-1 overflow-hidden">
                        <div className="fw-semibold text-truncate small">{item.name}</div>
                        {item.attribute_name && <div className="text-muted" style={{ fontSize: 11 }}>{item.attribute_name}</div>}
                        <div style={{ fontSize: 11 }}>{formatPrice(item.price)} × {item.quantity} = <strong>{formatPrice(item.price * item.quantity)}</strong></div>
                        <div className="d-flex align-items-center gap-1 mt-1">
                          <button className="btn btn-outline-secondary btn-sm py-0 px-1" style={{ lineHeight: 1 }} onClick={() => adjustQty(item.key, -1)}>−</button>
                          <span className="small px-1">{item.quantity}</span>
                          <button className="btn btn-outline-secondary btn-sm py-0 px-1" style={{ lineHeight: 1 }} onClick={() => adjustQty(item.key, 1)} disabled={item.quantity >= item.in_stock}>+</button>
                        </div>
                      </div>
                      <button className="btn btn-outline-danger btn-sm flex-shrink-0" onClick={() => removeFromCart(item.key)}>
                        <i className="fa-solid fa-xmark" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Customer + Place Order ── */}
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-header py-2 d-flex align-items-center">
              <strong>Customer</strong>
              <button className="btn btn-sm btn-success ms-auto" onClick={() => setShowAddCustomer(true)} title="Add new customer">
                <i className="fa-solid fa-plus" />
              </button>
            </div>
            <div className="card-body p-2">
              {selectedCustomer ? (
                <div className="alert alert-success py-2 px-3 mb-2 d-flex justify-content-between align-items-center small">
                  <div>
                    <div className="fw-semibold">{selectedCustomer.name}</div>
                    <div>{selectedCustomer.phone}</div>
                  </div>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedCustomer(null)}>
                    <i className="fa-solid fa-xmark" />
                  </button>
                </div>
              ) : (
                <div className="input-group mb-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search by phone or name…"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                </div>
              )}

              {!selectedCustomer && (
                <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                  {loadingCustomers ? (
                    <div className="text-center py-2"><span className="spinner-border spinner-border-sm" /></div>
                  ) : (
                    (Array.isArray(customers) ? customers : []).map((c) => (
                      <div
                        key={c.id}
                        className="p-2 border-bottom small cursor-pointer"
                        style={{ cursor: 'pointer' }}
                        onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); }}
                      >
                        <div className="fw-semibold">{c.name || c.phone}</div>
                        {c.name && <div className="text-muted">{c.phone}</div>}
                      </div>
                    ))
                  )}
                </div>
              )}

              <div className="mt-3">
                <button
                  className="btn btn-primary w-100"
                  onClick={handlePlaceOrder}
                  disabled={cartItems.length === 0 || !selectedCustomer || !selectedShop}
                >
                  <i className="fa-solid fa-cart-shopping me-2" />
                  Place Order
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attribute selection modal */}
      <Modal show={showAttrModal} onHide={() => setShowAttrModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6">{attrProduct?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {attrProduct?.primary_photo && (
            <div className="text-center mb-3">
              <img src={attrProduct.primary_photo} alt={attrProduct.name} style={{ maxHeight: 120, objectFit: 'contain' }} />
            </div>
          )}
          <div className="mb-2 small">
            <span className="fw-semibold">Price: </span>{formatPrice(attrProduct?.sell_price?.price ?? attrProduct?.price)}
            {attrProduct?.stock && <span className="ms-3 text-muted">Stock: {attrProduct.stock}</span>}
          </div>
          <select
            className={`form-select ${attrError ? 'is-invalid' : ''}`}
            value={selectedAttr}
            onChange={(e) => { setSelectedAttr(e.target.value); setAttrError(false); }}
          >
            <option value="">Select attribute</option>
            {(attrProduct?.attributes ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.attribute_name} {a.attribute_value}
                {a.number ? ` (${a.math_sign}${a.number})` : ''}
              </option>
            ))}
          </select>
          {attrError && <div className="invalid-feedback">Please select an attribute.</div>}
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAttrModal(false)}>Cancel</button>
          <button className="btn btn-success btn-sm" onClick={handleConfirmAttr}>Add to Cart</button>
        </Modal.Footer>
      </Modal>

      {/* Add customer modal */}
      <Modal show={showAddCustomer} onHide={() => setShowAddCustomer(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6">Add New Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-2">
            <label className="form-label small">Name <span className="text-danger">*</span></label>
            <input type="text" className="form-control" value={newCustomer.name} onChange={(e) => setNewCustomer((c) => ({ ...c, name: e.target.value }))} placeholder="Customer name" />
          </div>
          <div className="mb-2">
            <label className="form-label small">Phone <span className="text-danger">*</span></label>
            <input type="text" className="form-control" value={newCustomer.phone} onChange={(e) => setNewCustomer((c) => ({ ...c, phone: e.target.value }))} placeholder="Phone number" />
          </div>
          <div className="mb-2">
            <label className="form-label small">Email</label>
            <input type="email" className="form-control" value={newCustomer.email} onChange={(e) => setNewCustomer((c) => ({ ...c, email: e.target.value }))} placeholder="Email (optional)" />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAddCustomer(false)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleCreateCustomer} disabled={createCustomer.isPending}>
            {createCustomer.isPending ? 'Saving…' : 'Add Customer'}
          </button>
        </Modal.Footer>
      </Modal>

      {/* Order confirmation modal */}
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6">Confirm Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <table className="table table-sm table-bordered mb-3">
            <tbody>
              <tr><th>Customer</th><td>{selectedCustomer?.name} — {selectedCustomer?.phone}</td></tr>
              <tr><th>Branch</th><td>{shops.find((s) => String(s.id) === String(selectedShop))?.name ?? '—'}</td></tr>
              <tr><th>Items</th><td>{summary.items}</td></tr>
              <tr><th>Total</th><td><strong>{formatPrice(summary.payable)}</strong></td></tr>
            </tbody>
          </table>

          <div className="mb-2">
            <label className="form-label small">Payment Method</label>
            <select
              className="form-select form-select-sm"
              value={summary.payment_method_id}
              onChange={(e) => setSummary((s) => ({ ...s, payment_method_id: e.target.value }))}
            >
              <option value="">Select method</option>
              {paymentMethods.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          <div className="mb-2">
            <label className="form-label small">Paid Amount</label>
            <input
              type="number"
              className="form-control form-control-sm"
              min={0}
              max={summary.payable}
              value={summary.paid}
              onChange={(e) => handlePaidChange(e.target.value)}
            />
          </div>

          <div className="mb-2">
            <label className="form-label small">Due Amount</label>
            <div className="form-control-plaintext fw-semibold text-danger small">{formatPrice(summary.due)}</div>
          </div>

          {summary.payment_method_id && summary.payment_method_id !== '1' && (
            <div className="mb-2">
              <label className="form-label small">Transaction Reference</label>
              <input type="text" className="form-control form-control-sm" placeholder="TRX ID" value={summary.trx_id} onChange={(e) => setSummary((s) => ({ ...s, trx_id: e.target.value }))} />
            </div>
          )}

          <div className="mb-2">
            <label className="form-label small">Sales Manager</label>
            <select
              className="form-select form-select-sm"
              value={summary.sales_manager_id}
              onChange={(e) => setSummary((s) => ({ ...s, sales_manager_id: e.target.value }))}
            >
              <option value="">— Select (optional) —</option>
              {salesManagers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowConfirm(false)} disabled={createStoreOrder.isPending}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSubmitOrder} disabled={createStoreOrder.isPending}>
            {createStoreOrder.isPending ? (
              <><span className="spinner-border spinner-border-sm me-1" />Placing…</>
            ) : 'Place Order'}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
