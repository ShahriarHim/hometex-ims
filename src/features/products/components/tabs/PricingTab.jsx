import { TextField } from '../../../../shared/components/FormField';

/**
 * PricingTab
 * Props:
 *   data      { cost, price, discount_percent, discount_fixed, discount_start, discount_end }
 *   onChange  (patch) => void
 *   errors    object
 */
export default function PricingTab({ data, onChange, errors = {} }) {
  const set = (field) => (e) => onChange({ [field]: e.target.value });

  return (
    <div className="row">
      <div className="col-md-4">
        <TextField label="Cost Price (৳)" name="cost" type="number" value={data.cost}
          onChange={set('cost')} error={errors.cost} required
          hint="Purchase / production cost." />
      </div>
      <div className="col-md-4">
        <TextField label="Selling Price (৳)" name="price" type="number" value={data.price}
          onChange={set('price')} error={errors.price} required />
      </div>

      <div className="col-md-4" />

      <div className="col-md-3">
        <TextField label="Discount %" name="discount_percent" type="number"
          value={data.discount_percent} onChange={set('discount_percent')}
          error={errors.discount_percent} />
      </div>
      <div className="col-md-3">
        <TextField label="Discount Fixed (৳)" name="discount_fixed" type="number"
          value={data.discount_fixed} onChange={set('discount_fixed')}
          error={errors.discount_fixed} />
      </div>
      <div className="col-md-3">
        <TextField label="Discount Start" name="discount_start" type="date"
          value={data.discount_start} onChange={set('discount_start')}
          error={errors.discount_start} />
      </div>
      <div className="col-md-3">
        <TextField label="Discount End" name="discount_end" type="date"
          value={data.discount_end} onChange={set('discount_end')}
          error={errors.discount_end} />
      </div>

      {/* Computed preview */}
      {data.price && (
        <div className="col-12 mt-2">
          <div className="alert alert-info py-2">
            <strong>Effective sale price: </strong>
            {(
              Number(data.price) -
              (Number(data.discount_fixed) || 0) -
              (Number(data.price) * (Number(data.discount_percent) || 0)) / 100
            ).toFixed(2)}{' '}
            ৳
          </div>
        </div>
      )}
    </div>
  );
}
