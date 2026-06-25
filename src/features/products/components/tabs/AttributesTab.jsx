import { SelectField } from '../../../../shared/components/FormField';

/**
 * AttributesTab — product variants (size, color, etc. with per-attribute cost).
 *
 * Props:
 *   data        { attributes: { [rowId]: AttributeRow } }
 *   onChange    (patch) => void
 *   attributes  [{ id, name, value: [{ id, name }] }]  from useProductFormData (API key is "value", singular)
 *   errors      object
 *
 * AttributeRow shape:
 *   { attribute_id, value_id, math_sign, number,
 *     attribute_cost, attribute_weight, attribute_mesarment }
 */
export default function AttributesTab({ data, onChange, attributes = [], errors = {} }) {
  const rows = data.attributes ?? {};
  const rowIds = Object.keys(rows);
  const nextId = rowIds.length > 0 ? Math.max(...rowIds.map(Number)) + 1 : 1;

  const addRow = () => {
    onChange({ attributes: { ...rows, [nextId]: { attribute_id: '', value_id: '',
      math_sign: '+', number: '', attribute_cost: '', attribute_weight: '',
      attribute_mesarment: '' } } });
  };

  const removeRow = (id) => {
    const copy = { ...rows };
    delete copy[id];
    onChange({ attributes: copy });
  };

  const setRowField = (id, field, value) => {
    onChange({ attributes: { ...rows, [id]: { ...rows[id], [field]: value } } });
  };

  const getValues = (attrId) => {
    const attr = attributes.find((a) => String(a.id) === String(attrId));
    // Backend returns the per-attribute value list under "value" (singular), not "values".
    return attr?.value ?? attr?.values ?? [];
  };

  const attributeOptions = attributes.map((a) => ({ value: a.id, label: a.name }));

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">Product Attributes / Variants</h6>
        <button
          type="button"
          className="btn btn-sm btn-outline-primary"
          onClick={addRow}
          disabled={rowIds.length >= attributes.length && attributes.length > 0}
        >
          <i className="fa-solid fa-plus me-1" /> Add Attribute
        </button>
      </div>

      {rowIds.length === 0 && (
        <p className="text-muted">No attributes added. Click &quot;Add Attribute&quot; to create variants.</p>
      )}

      {rowIds.map((id) => {
        const row = rows[id];
        const valueOptions = getValues(row.attribute_id).map((v) => ({
          value: v.id, label: v.name,
        }));
        return (
          <div key={id} className="card card-body mb-3 bg-light">
            <div className="row g-2">
              <div className="col-6 col-md-3">
                <SelectField label="Attribute" name={`attr_${id}`}
                  value={row.attribute_id} options={attributeOptions}
                  onChange={(e) => setRowField(id, 'attribute_id', e.target.value)}
                  error={errors[`attributes.${id}.attribute_id`]} />
              </div>
              <div className="col-6 col-md-3">
                <SelectField label="Value" name={`val_${id}`}
                  value={row.value_id} options={valueOptions}
                  onChange={(e) => setRowField(id, 'value_id', e.target.value)}
                  error={errors[`attributes.${id}.value_id`]} />
              </div>
              <div className="col-4 col-md-1">
                <SelectField label="Sign" name={`sign_${id}`} value={row.math_sign}
                  options={[{ value: '+', label: '+' }, { value: '-', label: '-' },
                    { value: '*', label: '×' }]}
                  onChange={(e) => setRowField(id, 'math_sign', e.target.value)} />
              </div>
              <div className="col-4 col-md-1">
                <label className="form-label fw-semibold">Number</label>
                <input className="form-control" type="number" value={row.number}
                  onChange={(e) => setRowField(id, 'number', e.target.value)} />
              </div>
              <div className="col-4 col-md-2">
                <label className="form-label fw-semibold">Add. Cost (৳)</label>
                <input className="form-control" type="number" value={row.attribute_cost}
                  onChange={(e) => setRowField(id, 'attribute_cost', e.target.value)} />
              </div>
              <div className="col-6 col-md-1">
                <label className="form-label fw-semibold">Weight</label>
                <input className="form-control" type="number" value={row.attribute_weight}
                  onChange={(e) => setRowField(id, 'attribute_weight', e.target.value)} />
              </div>
              <div className="col-6 col-md-1">
                <label className="form-label fw-semibold d-block">&nbsp;</label>
                <button type="button" className="btn btn-danger w-100"
                  onClick={() => removeRow(id)}>
                  <i className="fa-solid fa-trash" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
