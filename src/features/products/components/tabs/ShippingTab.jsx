import { TextField, SelectField } from '../../../../shared/components/FormField';

const WEIGHT_UNITS = [
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'g' },
  { value: 'lb', label: 'lb' },
  { value: 'oz', label: 'oz' },
];

const DIM_UNITS = [
  { value: 'cm', label: 'cm' },
  { value: 'mm', label: 'mm' },
  { value: 'in', label: 'in' },
];

/**
 * ShippingTab — weight, dimensions, shipping class.
 *
 * Props:
 *   data     { weight, weight_unit, length, width, height, dimension_unit, shipping_class }
 *   onChange (patch) => void
 *   errors   object
 */
export default function ShippingTab({ data, onChange, errors = {} }) {
  const set = (field) => (e) => onChange({ [field]: e.target.value });

  return (
    <div className="row g-3">
      <div className="col-12">
        <h6 className="mb-3">Weight</h6>
      </div>

      <div className="col-md-6">
        <TextField
          label="Weight"
          name="weight"
          type="number"
          value={data.weight}
          onChange={set('weight')}
          error={errors.weight}
          hint="Product weight for shipping calculation."
        />
      </div>
      <div className="col-md-6">
        <SelectField
          label="Weight Unit"
          name="weight_unit"
          value={data.weight_unit}
          onChange={set('weight_unit')}
          options={WEIGHT_UNITS}
          error={errors.weight_unit}
        />
      </div>

      <div className="col-12">
        <h6 className="mb-2 mt-2">Dimensions</h6>
      </div>

      <div className="col-md-3">
        <TextField
          label="Length"
          name="length"
          type="number"
          value={data.length}
          onChange={set('length')}
          error={errors.length}
        />
      </div>
      <div className="col-md-3">
        <TextField
          label="Width"
          name="width"
          type="number"
          value={data.width}
          onChange={set('width')}
          error={errors.width}
        />
      </div>
      <div className="col-md-3">
        <TextField
          label="Height"
          name="height"
          type="number"
          value={data.height}
          onChange={set('height')}
          error={errors.height}
        />
      </div>
      <div className="col-md-3">
        <SelectField
          label="Dimension Unit"
          name="dimension_unit"
          value={data.dimension_unit}
          onChange={set('dimension_unit')}
          options={DIM_UNITS}
          error={errors.dimension_unit}
        />
      </div>

      <div className="col-md-6">
        <TextField
          label="Shipping Class"
          name="shipping_class"
          value={data.shipping_class}
          onChange={set('shipping_class')}
          error={errors.shipping_class}
          hint="e.g. standard, express, fragile"
        />
      </div>
    </div>
  );
}
