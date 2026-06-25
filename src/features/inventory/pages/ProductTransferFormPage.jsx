import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import PageHeader from '../../../shared/components/PageHeader';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import { useProduct } from '../../products/api';
import { useCreateTransfer, useShopListForTransfer } from '../api';
import { useAuth } from '../../../shared/hooks/useAuth';

const EMPTY = { from_shop_id: '', to_shop_id: '', attribute_id: '', quantity: 1 };

const toast = (icon, title) =>
  Swal.fire({ toast: true, position: 'top-end', icon, title, timer: 1400, showConfirmButton: false });

export default function ProductTransferFormPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { assignedShopId: rawAssignedShopId, isLoading: authLoading } = useAuth();
  const assignedShopId = rawAssignedShopId ? String(rawAssignedShopId) : null;

  const [form, setForm] = useState({ ...EMPTY, product_id: id });

  const { data: productRes, isLoading: loadingProduct } = useProduct(id);
  const { data: allShops = [],  isLoading: loadingShops  } = useShopListForTransfer();
  const { mutate: createTransfer, isPending } = useCreateTransfer();

  const product    = productRes;
  const stockByShop = Object.fromEntries(
    (product?.shop_quantities ?? []).map((s) => [String(s.shop_id), s.quantity])
  );
  // flattenProduct stores attributes as { [rowId]: { attribute_name, attribute_value, ... } }
  const attributes = Object.entries(product?.attributes ?? {}).map(([rowId, a]) => ({
    ...a,
    id: rowId,
  }));

  useEffect(() => {
    setForm({ ...EMPTY, product_id: id, from_shop_id: assignedShopId ?? '' });
  }, [id, assignedShopId]);

  const set = (field, value) => {
    setForm((prev) => {
      if (field === 'from_shop_id' && value === prev.to_shop_id) return prev;
      if (field === 'to_shop_id'   && value === prev.from_shop_id) return prev;
      return { ...prev, [field]: value };
    });
  };

  const selectedSourceQty = form.from_shop_id ? (stockByShop[String(form.from_shop_id)] ?? null) : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.from_shop_id || !form.to_shop_id) {
      toast('warning', 'Please select both From and To shops');
      return;
    }
    if (Number(form.quantity) < 1) {
      toast('warning', 'Quantity must be at least 1');
      return;
    }
    if (selectedSourceQty !== null && Number(form.quantity) > selectedSourceQty) {
      toast('warning', `Only ${selectedSourceQty} units available in selected shop`);
      return;
    }

    const payload = { product_id: id, ...form };
    if (!payload.attribute_id) delete payload.attribute_id;

    createTransfer(
      payload,
      {
        onSuccess: (res) => {
          toast(res?.cls ?? 'success', res?.message ?? 'Transfer created');
          navigate('/product/transfer/list');
        },
        onError: (err) => {
          toast('error', err?.response?.data?.message ?? 'Failed to create transfer');
        },
      },
    );
  };

  if (loadingProduct || loadingShops || authLoading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title={`Transfer Product${product?.name ? ` — ${product.name}` : ''}`}
        breadcrumb={[
          { label: 'Home', to: '/' },
          { label: 'Transfers', to: '/product/transfer/list' },
          { label: 'New Transfer' },
        ]}
        actionLabel="Transfer List"
        actionTo="/product/transfer/list"
        actionIcon="fa-arrow-left"
      />

      <div className="row justify-content-center">
        <div className="col-md-7">
          <div className="card">
            <div className="card-header py-2">
              <strong>Stock Transfer</strong>
            </div>
            <div className="card-body">
              {product?.name && (
                <div className="alert alert-info py-2 mb-3">
                  <strong>Product:</strong> {product.name}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    From Shop <span className="text-danger">*</span>
                    {assignedShopId && (
                      <span className="badge bg-info text-dark ms-2 fw-normal" style={{ fontSize: '0.7rem' }}>
                        <i className="fa-solid fa-lock me-1" />Your branch
                      </span>
                    )}
                  </label>
                  <select
                    className="form-select"
                    value={form.from_shop_id}
                    onChange={(e) => set('from_shop_id', e.target.value)}
                    disabled={Boolean(assignedShopId)}
                    required
                  >
                    <option value="">Select source shop</option>
                    {allShops.map((s) => {
                      const sid = s.id ?? s.shop_id;
                      const qty = stockByShop[String(sid)];
                      return (
                        <option
                          key={sid}
                          value={sid}
                          disabled={String(sid) === String(form.to_shop_id)}
                        >
                          {s.name ?? s.shop_name}{qty !== undefined ? ` — ${qty} in stock` : ''}
                        </option>
                      );
                    })}
                  </select>
                  {assignedShopId && (
                    <div className="form-text">You can only transfer stock from your assigned branch.</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    To Shop <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={form.to_shop_id}
                    onChange={(e) => set('to_shop_id', e.target.value)}
                    required
                  >
                    <option value="">Select destination shop</option>
                    {allShops.map((s) => (
                      <option
                        key={s.id ?? s.shop_id}
                        value={s.id ?? s.shop_id}
                        disabled={String(s.id ?? s.shop_id) === String(form.from_shop_id)}
                      >
                        {s.name ?? s.shop_name}
                      </option>
                    ))}
                  </select>
                </div>

                {attributes.length > 0 && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Attribute / Variant</label>
                    <select
                      className="form-select"
                      value={form.attribute_id}
                      onChange={(e) => set('attribute_id', e.target.value)}
                    >
                      <option value="">All variants</option>
                      {attributes.map((attr) => (
                        <option key={attr.id} value={attr.id}>
                          {attr.attribute_name} — ({attr.attribute_value})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    Quantity <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    min={1}
                    max={selectedSourceQty ?? undefined}
                    value={form.quantity}
                    onChange={(e) => set('quantity', e.target.value)}
                    required
                  />
                  {selectedSourceQty !== null && (
                    <div className="form-text">
                      Max available: <strong>{selectedSourceQty}</strong>
                    </div>
                  )}
                </div>

                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary" disabled={isPending}>
                    {isPending ? 'Submitting…' : 'Submit Transfer'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/product/transfer/list')}
                  >
                    Cancel
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
