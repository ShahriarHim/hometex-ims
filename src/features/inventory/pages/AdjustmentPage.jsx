import { useState } from 'react';
import Swal from 'sweetalert2';
import PageHeader from '../../../shared/components/PageHeader';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { useProducts } from '../../products/api';
import { useShopListForTransfer, useCreateAdjustment } from '../api';

const EMPTY = {
  product_id: '',
  attribute_id: '',
  shop_id: '',
  type: 'add',
  quantity: 1,
  notes: '',
};

const toast = (icon, title) =>
  Swal.fire({ toast: true, position: 'top-end', icon, title, timer: 1400, showConfirmButton: false });

export default function AdjustmentPage() {
  const [form, setForm]           = useState(EMPTY);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDropdown, setShowDropdown]       = useState(false);

  const debouncedSearch = useDebounce(productSearch, 400);

  const { data: productRes, isFetching: searchingProducts } = useProducts(
    debouncedSearch ? { search: debouncedSearch, per_page: 10 } : null,
  );
  const { data: shops = [] }              = useShopListForTransfer();
  const { mutate: adjust, isPending }     = useCreateAdjustment();

  const productOptions = productRes?.data?.products ?? productRes?.data ?? [];
  const attributes     = selectedProduct?.attributes ?? [];

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const selectProduct = (p) => {
    setSelectedProduct(p);
    setProductSearch(p.name);
    setShowDropdown(false);
    setForm((prev) => ({ ...prev, product_id: p.id, attribute_id: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.product_id) { toast('warning', 'Please select a product'); return; }
    if (!form.shop_id)    { toast('warning', 'Please select a shop/branch'); return; }
    if (Number(form.quantity) < 1) { toast('warning', 'Quantity must be at least 1'); return; }

    adjust(form, {
      onSuccess: (res) => {
        toast(res?.status ?? 'success', res?.message ?? 'Stock adjusted successfully');
        setForm(EMPTY);
        setSelectedProduct(null);
        setProductSearch('');
      },
      onError: (err) => {
        toast('error', err?.response?.data?.message ?? 'Adjustment failed');
      },
    });
  };

  return (
    <div>
      <PageHeader
        title="Stock Adjustment"
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Stock Adjustment' }]}
      />

      <div className="row justify-content-center">
        <div className="col-md-7">
          <div className="card">
            <div className="card-header py-2">
              <strong>Manual Stock Adjustment</strong>
            </div>
            <div className="card-body">
              <div className="alert alert-secondary py-2 mb-3 small">
                Use this form to manually correct stock levels. All adjustments are logged.
              </div>

              <form onSubmit={handleSubmit}>
                {/* Product search */}
                <div className="mb-3 position-relative">
                  <label className="form-label fw-semibold">
                    Product <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type to search product…"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowDropdown(true);
                      if (!e.target.value) {
                        setSelectedProduct(null);
                        setForm((prev) => ({ ...prev, product_id: '', attribute_id: '' }));
                      }
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                    autoComplete="off"
                  />
                  {showDropdown && debouncedSearch && (
                    <div
                      className="border rounded bg-white shadow-sm position-absolute w-100"
                      style={{ zIndex: 999, top: '100%', maxHeight: 220, overflowY: 'auto' }}
                    >
                      {searchingProducts ? (
                        <div className="px-3 py-2 text-muted small">Searching…</div>
                      ) : productOptions.length === 0 ? (
                        <div className="px-3 py-2 text-muted small">No products found</div>
                      ) : (
                        productOptions.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className="d-block w-100 text-start px-3 py-2 border-0 bg-transparent"
                            style={{ fontSize: '0.875rem' }}
                            onMouseDown={() => selectProduct(p)}
                          >
                            {p.name}
                            {p.sku && <span className="text-muted ms-2 small">{p.sku}</span>}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Attribute */}
                {attributes.length > 0 && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Attribute / Variant</label>
                    <select
                      className="form-select"
                      value={form.attribute_id}
                      onChange={(e) => set('attribute_id', e.target.value)}
                    >
                      <option value="">All variants / No attribute</option>
                      {attributes.map((attr) => (
                        <option key={attr.id} value={attr.id}>
                          {attr.attribute_name} — ({attr.attribute_value})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Shop */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Branch / Shop <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={form.shop_id}
                    onChange={(e) => set('shop_id', e.target.value)}
                    required
                  >
                    <option value="">Select branch</option>
                    {shops.map((s) => (
                      <option key={s.id ?? s.shop_id} value={s.id ?? s.shop_id}>
                        {s.name ?? s.shop_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Adjustment type */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Adjustment Type</label>
                  <div className="d-flex gap-3">
                    {[
                      { value: 'add',      label: 'Add Stock',      cls: 'btn-outline-success' },
                      { value: 'subtract', label: 'Remove Stock',   cls: 'btn-outline-danger'  },
                      { value: 'set',      label: 'Set Exact Value', cls: 'btn-outline-primary' },
                    ].map(({ value, label, cls }) => (
                      <button
                        key={value}
                        type="button"
                        className={`btn btn-sm ${form.type === value ? cls.replace('outline-', '') : cls}`}
                        onClick={() => set('type', value)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Quantity <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    min={1}
                    value={form.quantity}
                    onChange={(e) => set('quantity', e.target.value)}
                    required
                  />
                </div>

                {/* Notes */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">Reason / Notes</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="e.g. Damaged goods, stocktake correction, supplier delivery…"
                    value={form.notes}
                    onChange={(e) => set('notes', e.target.value)}
                  />
                </div>

                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary" disabled={isPending}>
                    {isPending ? 'Saving…' : 'Apply Adjustment'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => { setForm(EMPTY); setSelectedProduct(null); setProductSearch(''); }}
                  >
                    Clear
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
