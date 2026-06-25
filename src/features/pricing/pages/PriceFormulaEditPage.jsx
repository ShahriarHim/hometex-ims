import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import PageHeader from '../../../shared/components/PageHeader';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import { usePriceFormula, useUpdatePriceFormula } from '../api';

const toast = (icon, title) =>
  Swal.fire({ toast: true, position: 'top-end', icon, title, timer: 1400, showConfirmButton: false });

export default function PriceFormulaEditPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();

  const { data: formula, isLoading, isError } = usePriceFormula(id);
  const updateFormula = useUpdatePriceFormula();

  const [form, setForm] = useState({ name: '', formula: '', field_limit: '', description: '', status: 1 });

  useEffect(() => {
    if (formula) {
      setForm({
        name:        formula.name        ?? '',
        formula:     formula.formula     ?? '',
        field_limit: formula.field_limit ?? '',
        description: formula.description ?? '',
        status:      formula.status      ?? 1,
      });
    }
  }, [formula]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())    return toast('warning', 'Formula name is required');
    if (!form.formula.trim()) return toast('warning', 'Formula expression is required');

    try {
      const res = await updateFormula.mutateAsync({
        id,
        ...form,
        status: Number(form.status),
        description: form.description || null,
        field_limit: form.field_limit || null,
      });
      toast(res.status, res.message);
      navigate('/price-formulas');
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Something went wrong';
      toast('error', msg);
    }
  };

  if (isLoading) return <LoadingSpinner fullPage />;

  if (isError || !formula) {
    return (
      <div className="text-center py-5 text-muted">
        <i className="fa-solid fa-circle-exclamation fa-2x mb-2 d-block" />
        Formula not found.
        <div className="mt-3">
          <Link to="/price-formulas" className="btn btn-sm btn-outline-secondary">Back to list</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Edit Price Formula"
        breadcrumb={[
          { label: 'Home', to: '/' },
          { label: 'Price Formulas', to: '/price-formulas' },
          { label: 'Edit' },
        ]}
      />

      <div className="row justify-content-center">
        <div className="col-lg-7">
          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmit}>

                <div className="mb-3">
                  <label className="form-label">Formula Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Pillow Cover Formula"
                    value={form.name}
                    onChange={set('name')}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Expression <span className="text-danger">*</span>
                    <span className="text-muted ms-2 fw-normal" style={{ fontSize: '0.8rem' }}>
                      Use field letters defined in Field Limits
                    </span>
                  </label>
                  <input
                    type="text"
                    className="form-control font-monospace"
                    placeholder="e.g. l*w*2 or (l+10)*(w+20)"
                    value={form.formula}
                    onChange={set('formula')}
                  />
                  {form.formula && (
                    <div className="mt-1">
                      <small className="text-muted">Preview: </small>
                      <code className="bg-light px-2 py-1 rounded text-dark ms-1" style={{ fontSize: '0.8rem' }}>
                        {form.formula}
                      </code>
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Field Limits
                    <span className="text-muted ms-2 fw-normal" style={{ fontSize: '0.8rem' }}>
                      Format: field:min-max (semicolon-separated)
                    </span>
                  </label>
                  <input
                    type="text"
                    className="form-control font-monospace"
                    placeholder="e.g. l:20-300;w:20-300"
                    value={form.field_limit}
                    onChange={set('field_limit')}
                  />
                  {form.field_limit && (
                    <div className="mt-1 d-flex flex-wrap gap-1">
                      {form.field_limit.split(';').filter(Boolean).map((part, i) => {
                        const [field, range] = part.split(':');
                        return field && range ? (
                          <span key={i} className="badge bg-light text-dark border" style={{ fontFamily: 'monospace' }}>
                            {field}: {range}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: Number(e.target.value) }))}>
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Optional notes about this formula…"
                    value={form.description}
                    onChange={set('description')}
                  />
                </div>

                <div className="d-flex gap-2 justify-content-end">
                  <Link to="/price-formulas" className="btn btn-outline-secondary">Cancel</Link>
                  <button type="submit" className="btn btn-primary" disabled={updateFormula.isPending}>
                    {updateFormula.isPending && <span className="spinner-border spinner-border-sm me-1" />}
                    Update Formula
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
