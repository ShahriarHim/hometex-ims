import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import PageHeader from '../../../shared/components/PageHeader';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import LocationSelect from '../../../shared/components/LocationSelect';
import { useSupplier, useCreateSupplier, useUpdateSupplier } from '../api';

const EMPTY = {
  name: '', phone: '', email: '', status: '1', details: '', logo: '',
  address: '', landmark: '', division_id: '', district_id: '', area_id: '',
};

const toast = (icon, title) =>
  Swal.fire({ toast: true, position: 'top-end', icon, title, timer: 1400, showConfirmButton: false });

export default function SupplierFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm]               = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [logoPreview, setLogoPreview] = useState(null);
  const fileRef = useRef(null);
  const populated = useRef(false);

  const { data: res, isLoading } = useSupplier(id);
  const { mutate: create, isPending: creating } = useCreateSupplier();
  const { mutate: update, isPending: updating } = useUpdateSupplier(id);

  const supplier = res?.data ?? res;

  useEffect(() => {
    if (!supplier || populated.current) return;
    populated.current = true;
    setForm({
      name:        supplier.name        ?? '',
      phone:       supplier.phone       ?? '',
      email:       supplier.email       ?? '',
      status:      String(supplier.status ?? '1'),
      details:     supplier.details     ?? '',
      address:     supplier.address     ?? '',
      landmark:    supplier.landmark    ?? '',
      division_id: supplier.division_id ?? '',
      district_id: supplier.district_id ?? '',
      area_id:     supplier.area_id     ?? '',
      logo:        '',
    });
    if (supplier.display_logo ?? supplier.logo) setLogoPreview(supplier.display_logo ?? supplier.logo);
  }, [supplier]);

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { set('logo', reader.result); setLogoPreview(reader.result); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFieldErrors({});
    const fn = isEdit ? update : create;
    fn(form, {
      onSuccess: (res) => {
        toast(res?.status ?? 'success', res?.message ?? (isEdit ? 'Supplier updated' : 'Supplier created'));
        navigate('/suppliers');
      },
      onError: (err) => {
        const msg    = err?.response?.data?.message ?? 'Save failed';
        const errors = err?.response?.data?.errors ?? {};
        if (Object.keys(errors).length) setFieldErrors(errors);
        toast('error', msg);
      },
    });
  };

  if (isEdit && isLoading) return <LoadingSpinner />;

  const isPending = creating || updating;

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Supplier' : 'Add Supplier'}
        breadcrumb={[
          { label: 'Home', to: '/' },
          { label: 'Suppliers', to: '/suppliers' },
          { label: isEdit ? 'Edit' : 'Add' },
        ]}
        actionLabel="Back to Suppliers"
        actionTo="/suppliers"
        actionIcon="fa-arrow-left"
      />

      <div className="row justify-content-center">
        <div className="col-md-9">
          <div className="card">
            <div className="card-header py-2"><strong>{isEdit ? 'Edit Supplier' : 'New Supplier'}</strong></div>
            <div className="card-body">
              <form onSubmit={handleSubmit} noValidate>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Name <span className="text-danger">*</span></label>
                    <input className={`form-control${fieldErrors.name ? ' is-invalid' : ''}`} value={form.name} onChange={(e) => set('name', e.target.value)} />
                    {fieldErrors.name && <div className="invalid-feedback d-block">{Array.isArray(fieldErrors.name) ? fieldErrors.name[0] : fieldErrors.name}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Phone <span className="text-danger">*</span></label>
                    <input className={`form-control${fieldErrors.phone ? ' is-invalid' : ''}`} type="number" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                    {fieldErrors.phone && <div className="invalid-feedback d-block">{Array.isArray(fieldErrors.phone) ? fieldErrors.phone[0] : fieldErrors.phone}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Email <span className="text-danger">*</span></label>
                    <input className={`form-control${fieldErrors.email ? ' is-invalid' : ''}`} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
                    {fieldErrors.email && <div className="invalid-feedback d-block">{Array.isArray(fieldErrors.email) ? fieldErrors.email[0] : fieldErrors.email}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Status</label>
                    <select className="form-select" value={form.status} onChange={(e) => set('status', e.target.value)}>
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Details</label>
                    <textarea className="form-control" rows={3} value={form.details} onChange={(e) => set('details', e.target.value)} />
                  </div>

                  <div className="col-12">
                    <hr className="my-1" />
                    <p className="text-muted small mb-2">Address</p>
                    <LocationSelect
                      value={{ division_id: form.division_id, district_id: form.district_id, area_id: form.area_id }}
                      onChange={set}
                    />
                  </div>
                  <div className="col-md-8">
                    <label className="form-label">Street Address</label>
                    <input className="form-control" value={form.address} onChange={(e) => set('address', e.target.value)} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Landmark</label>
                    <input className="form-control" value={form.landmark} onChange={(e) => set('landmark', e.target.value)} />
                  </div>

                  <div className="col-12">
                    <hr className="my-1" />
                    <label className="form-label fw-semibold">Logo</label>
                    <input ref={fileRef} type="file" className="form-control" accept="image/*" onChange={handleFile} />
                    {logoPreview && (
                      <div className="mt-2 d-flex align-items-center gap-2">
                        <img src={logoPreview} alt="preview" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }} />
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => { setLogoPreview(null); set('logo', ''); if (fileRef.current) fileRef.current.value = ''; }}>
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="d-flex gap-2 mt-4">
                  <button type="submit" className="btn btn-primary" disabled={isPending}>
                    {isPending ? 'Saving…' : (isEdit ? 'Update Supplier' : 'Create Supplier')}
                  </button>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/suppliers')}>
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
