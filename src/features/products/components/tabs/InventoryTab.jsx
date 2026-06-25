import { ReactSelectField } from '../../../../shared/components/FormField';

/**
 * InventoryTab — per-shop stock allocation.
 *
 * Props:
 *   data        { shop_quantities: [{ shop_id, quantity }], stock: number }
 *   onChange    (patch) => void
 *   shops       [{ value, label }]  from useProductFormData (Shop::getShopIdAndName() already
 *               returns react-select-ready pairs, not { id, name })
 *   errors      object
 */
export default function InventoryTab({ data, onChange, shops = [], errors = {} }) {
  const shopOptions = shops;

  const selectedShopOptions = shopOptions.filter((opt) =>
    data.shop_quantities.some((sq) => String(sq.shop_id) === String(opt.value))
  );

  const handleShopSelect = (selected) => {
    const selectedIds = (selected ?? []).map((o) => o.value);
    const existing = data.shop_quantities.filter((sq) =>
      selectedIds.includes(sq.shop_id)
    );
    const added = selectedIds
      .filter((id) => !existing.some((sq) => sq.shop_id === id))
      .map((id) => ({ shop_id: id, quantity: 0 }));
    onChange({ shop_quantities: [...existing, ...added] });
  };

  const handleQuantityChange = (shopId, qty) => {
    const updated = data.shop_quantities.map((sq) =>
      sq.shop_id === shopId ? { ...sq, quantity: Number(qty) || 0 } : sq
    );
    const totalStock = updated.reduce((sum, sq) => sum + sq.quantity, 0);
    onChange({ shop_quantities: updated, stock: totalStock });
  };

  const totalStock = data.shop_quantities.reduce((sum, sq) => sum + (sq.quantity || 0), 0);

  return (
    <div className="row">
      <div className="col-12">
        <ReactSelectField
          name="shops"
          label="Assign Shops"
          isMulti
          options={shopOptions}
          value={selectedShopOptions}
          onChange={handleShopSelect}
          hint="Select the branches this product is stocked in."
        />
      </div>

      {data.shop_quantities.map((sq) => {
        const shop = shops.find((s) => String(s.value) === String(sq.shop_id));
        return (
          <div key={sq.shop_id} className="col-md-4">
            <label className="form-label fw-semibold">
              {shop?.label ?? `Shop ${sq.shop_id}`} — Stock
            </label>
            <input
              className="form-control"
              type="number"
              min="0"
              value={sq.quantity}
              onChange={(e) => handleQuantityChange(sq.shop_id, e.target.value)}
            />
          </div>
        );
      })}

      {totalStock > 0 && (
        <div className="col-12 mt-3">
          <div className="alert alert-success py-2">
            <strong>Total stock across all shops: {totalStock}</strong>
          </div>
        </div>
      )}

      {errors.stock && (
        <div className="col-12">
          <div className="text-danger small">{errors.stock[0]}</div>
        </div>
      )}
    </div>
  );
}
