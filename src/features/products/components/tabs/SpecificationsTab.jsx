/**
 * SpecificationsTab — arbitrary key-value product specs (material, dimensions, etc.)
 *
 * Props:
 *   data      { specifications: { [rowId]: { name, value } } }
 *   onChange  (patch) => void
 *   errors    object
 */
export default function SpecificationsTab({ data, onChange, errors = {} }) {
  const rows = data.specifications ?? {};
  const rowIds = Object.keys(rows);
  const nextId = rowIds.length > 0 ? Math.max(...rowIds.map(Number)) + 1 : 1;

  const addRow = () =>
    onChange({ specifications: { ...rows, [nextId]: { name: '', value: '' } } });

  const removeRow = (id) => {
    const copy = { ...rows };
    delete copy[id];
    onChange({ specifications: copy });
  };

  const setField = (id, field, value) =>
    onChange({ specifications: { ...rows, [id]: { ...rows[id], [field]: value } } });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">Specifications</h6>
        <button type="button" className="btn btn-sm btn-outline-primary" onClick={addRow}>
          <i className="fa-solid fa-plus me-1" /> Add Specification
        </button>
      </div>

      {rowIds.length === 0 && (
        <p className="text-muted">No specifications added yet.</p>
      )}

      {rowIds.map((id) => (
        <div key={id} className="row g-2 mb-2 align-items-center">
          <div className="col-md-5">
            <input
              className="form-control"
              placeholder="Name (e.g. Material)"
              value={rows[id].name}
              onChange={(e) => setField(id, 'name', e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <input
              className="form-control"
              placeholder="Value (e.g. 100% Cotton)"
              value={rows[id].value}
              onChange={(e) => setField(id, 'value', e.target.value)}
            />
          </div>
          <div className="col-md-1">
            <button type="button" className="btn btn-danger w-100" onClick={() => removeRow(id)}>
              <i className="fa-solid fa-trash" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
