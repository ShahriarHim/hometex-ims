import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import PageHeader from '../../../shared/components/PageHeader';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import LocationSelect from '../../../shared/components/LocationSelect';
import PasswordInput from '../../../shared/components/PasswordInput';
import { useEmployee, useEmployeeShops, useCreateEmployee, useUpdateEmployee, EMPLOYEE_TYPES } from '../api';

function FieldError({ errors, field }) {
  const msg = errors?.[field];
  if (!msg) return null;
  return <div className="invalid-feedback d-block">{Array.isArray(msg) ? msg[0] : msg}</div>;
}

const EMPTY = {
  name: '', phone: '', email: '', password: '', nid: '',
  shop_id: '', employee_type: '', status: '1',
  photo: '', nid_photo: '',
  address: '', landmark: '', bio: '',
  division_id: '', district_id: '', area_id: '',
};

const toast = (icon, title) =>
  Swal.fire({ toast: true, position: 'top-end', icon, title, timer: 1400, showConfirmButton: false });

export default function EmployeeFormPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const isEdit     = Boolean(id);

  const [form, setForm]               = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [photoPreview, setPhotoPreview]   = useState(null);
  const [nidPreview, setNidPreview]       = useState(null);
  const photoRef = useRef(null);
  const nidRef   = useRef(null);
  const populated = useRef(false);

  const { data: res, isLoading: loadingEmployee } = useEmployee(id);
  const { data: shops = [] }                      = useEmployeeShops();
  const { mutate: create, isPending: creating }   = useCreateEmployee();
  const { mutate: update, isPending: updating }   = useUpdateEmployee(id);

  const employee = res?.data ?? res;

  useEffect(() => {
    if (!employee || populated.current) return;
    populated.current = true;
    setForm({
      name:          employee.name          ?? '',
      phone:         employee.phone         ?? '',
      email:         employee.email         ?? '',
      password:      '',
      nid:           employee.nid           ?? '',
      shop_id:       String(employee.shop_id ?? employee.branch?.id ?? ''),
      employee_type: String(employee.employee_type ?? ''),
      status:        String(employee.status ?? '1'),
      photo:         '',
      nid_photo:     '',
      address:       employee.address       ?? '',
      landmark:      employee.landmark      ?? '',
      bio:           employee.bio           ?? '',
      division_id:   employee.division_id   ?? '',
      district_id:   employee.district_id   ?? '',
      area_id:       employee.area_id       ?? '',
    });
    if (employee.photo)     setPhotoPreview(employee.photo_full ?? employee.photo);
    if (employee.nid_photo) setNidPreview(employee.nid_photo_full ?? employee.nid_photo);
  }, [employee]);

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleFileChange = (field, previewSetter, ref) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { set(field, reader.result); previewSetter(reader.result); };
    reader.readAsDataURL(file);
  };

  const removePhoto = (field, previewSetter, ref) => {
    set(field, '');
    previewSetter(null);
    if (ref.current) ref.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFieldErrors({});
    const payload = { ...form };
    if (!payload.password) delete payload.password;

    const fn = isEdit ? update : create;
    fn(payload, {
      onSuccess: (res) => {
        toast(res?.status ?? 'success', res?.message ?? (isEdit ? 'Employee updated' : 'Employee created'));
        navigate('/employee');
      },
      onError: (err) => {
        const msg    = err?.response?.data?.message ?? 'Save failed';
        const errors = err?.response?.data?.errors ?? {};
        if (Object.keys(errors).length) setFieldErrors(errors);
        toast('error', msg);
      },
    });
  };

  if (isEdit && loadingEmployee) return <LoadingSpinner />;

  const isPending = creating || updating;

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Employee' : 'Add Employee'}
        breadcrumb={[
          { label: 'Home', to: '/' },
          { label: 'Employees', to: '/employee' },
          { label: isEdit ? 'Edit' : 'Add' },
        ]}
        actionLabel="Back to Employees"
        actionTo="/employee"
        actionIcon="fa-arrow-left"
      />

      <form onSubmit={handleSubmit} noValidate>
        <div className="row g-4">
          {/* Left — Employee Details */}
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-header py-2"><strong>Employee Details</strong></div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-semibold">Name <span className="text-danger">*</span></label>
                    <input
                      className={`form-control${fieldErrors.name ? ' is-invalid' : ''}`}
                      value={form.name}
                      onChange={(e) => set('name', e.target.value)}
                      placeholder="Full name"
                    />
                    <FieldError errors={fieldErrors} field="name" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Phone <span className="text-danger">*</span></label>
                    <input
                      className={`form-control${fieldErrors.phone ? ' is-invalid' : ''}`}
                      type="number"
                      value={form.phone}
                      onChange={(e) => set('phone', e.target.value)}
                      placeholder="01xxxxxxxxx"
                    />
                    <FieldError errors={fieldErrors} field="phone" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Email <span className="text-danger">*</span></label>
                    <input
                      className={`form-control${fieldErrors.email ? ' is-invalid' : ''}`}
                      type="email"
                      value={form.email}
                      onChange={(e) => set('email', e.target.value)}
                      placeholder="name@example.com"
                    />
                    <FieldError errors={fieldErrors} field="email" />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      Password {isEdit && <span className="text-muted fw-normal">(leave blank to keep current)</span>}
                      {!isEdit && <span className="text-danger">*</span>}
                    </label>
                    <PasswordInput
                      value={form.password}
                      onChange={(e) => set('password', e.target.value)}
                      placeholder={isEdit ? 'Enter new password to change' : 'Set password'}
                      required={!isEdit}
                      error={fieldErrors.password}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">NID / Passport / Driving License No</label>
                    <input
                      className={`form-control${fieldErrors.nid ? ' is-invalid' : ''}`}
                      value={form.nid}
                      onChange={(e) => set('nid', e.target.value)}
                      placeholder="ID document number"
                    />
                    <FieldError errors={fieldErrors} field="nid" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Branch / Shop <span className="text-danger">*</span></label>
                    <select
                      className={`form-select${fieldErrors.shop_id ? ' is-invalid' : ''}`}
                      value={form.shop_id}
                      onChange={(e) => set('shop_id', e.target.value)}
                    >
                      <option value="">Select branch</option>
                      {shops.map((s) => (
                        <option key={s.id} value={String(s.id)}>{s.name}</option>
                      ))}
                    </select>
                    <FieldError errors={fieldErrors} field="shop_id" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Employee Type <span className="text-danger">*</span></label>
                    <select
                      className={`form-select${fieldErrors.employee_type ? ' is-invalid' : ''}`}
                      value={form.employee_type}
                      onChange={(e) => set('employee_type', e.target.value)}
                    >
                      <option value="">Choose type</option>
                      {Object.entries(EMPLOYEE_TYPES).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    <FieldError errors={fieldErrors} field="employee_type" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Status</label>
                    <select className="form-select" value={form.status} onChange={(e) => set('status', e.target.value)}>
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <hr className="my-1" />
                    <label className="form-label fw-semibold">Photo</label>
                    <input
                      ref={photoRef}
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={handleFileChange('photo', setPhotoPreview, photoRef)}
                    />
                    {photoPreview && (
                      <div className="mt-2 d-flex align-items-center gap-2">
                        <img src={photoPreview} alt="preview" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: '50%' }} />
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removePhoto('photo', setPhotoPreview, photoRef)}>Remove</button>
                      </div>
                    )}
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">NID / Document Photo</label>
                    <input
                      ref={nidRef}
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={handleFileChange('nid_photo', setNidPreview, nidRef)}
                    />
                    {nidPreview && (
                      <div className="mt-2 d-flex align-items-center gap-2">
                        <img src={nidPreview} alt="nid preview" style={{ width: 80, height: 56, objectFit: 'cover', borderRadius: 4 }} />
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removePhoto('nid_photo', setNidPreview, nidRef)}>Remove</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Address */}
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-header py-2"><strong>Address & Bio</strong></div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12">
                    <LocationSelect
                      value={{ division_id: form.division_id, district_id: form.district_id, area_id: form.area_id }}
                      onChange={set}
                    />
                  </div>
                  <div className="col-md-8">
                    <label className="form-label">Street Address</label>
                    <input
                      className="form-control"
                      value={form.address}
                      onChange={(e) => set('address', e.target.value)}
                      placeholder="House, Road, Village…"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Landmark</label>
                    <input
                      className="form-control"
                      value={form.landmark}
                      onChange={(e) => set('landmark', e.target.value)}
                      placeholder="Nearby landmark"
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Bio</label>
                    <textarea
                      className="form-control"
                      rows={5}
                      value={form.bio}
                      onChange={(e) => set('bio', e.target.value)}
                      placeholder="Short background or notes about this employee…"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex gap-2 mt-4">
          <button type="submit" className="btn btn-primary" disabled={isPending}>
            {isPending ? 'Saving…' : (isEdit ? 'Update Employee' : 'Create Employee')}
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/employee')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
