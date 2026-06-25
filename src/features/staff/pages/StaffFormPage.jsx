import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import PageHeader from '../../../shared/components/PageHeader';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import PasswordInput from '../../../shared/components/PasswordInput';
import PhoneInput from '../../../shared/components/PhoneInput';
import { staffApi } from '../api';
import { useAuth } from '../../../shared/hooks/useAuth';

const EMPTY = {
  first_name: '', last_name: '', email: '', phone: '', phone_country_code: '+880',
  date_of_birth: '', gender: '', password: '',
  role: '', staff_shop_id: '', nid: '', status: 'active', bio: '',
};

const NID_VALID_LENGTHS = [10, 13, 17];

const toast = (icon, title) =>
  Swal.fire({ toast: true, position: 'top-end', icon, title, timer: 1400, showConfirmButton: false });

function FieldError({ errors, field }) {
  const msg = errors?.[field];
  if (!msg) return null;
  return <div className="invalid-feedback d-block">{Array.isArray(msg) ? msg[0] : msg}</div>;
}

function validateForm(form, isEdit, showPassword) {
  const errs = {};
  if (!form.first_name.trim()) errs.first_name = 'First name is required';
  if (!form.email.trim()) {
    errs.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errs.email = 'Enter a valid email address';
  }
  if (form.phone && !/^\d+$/.test(form.phone)) {
    errs.phone = 'Phone must contain digits only';
  }
  if (form.nid) {
    if (!/^\d+$/.test(form.nid)) {
      errs.nid = 'NID must contain digits only';
    } else if (!NID_VALID_LENGTHS.includes(form.nid.length)) {
      errs.nid = 'NID must be 10, 13, or 17 digits';
    }
  }
  if (showPassword && !isEdit && !form.password) {
    errs.password = 'Password is required';
  }
  if (showPassword && form.password && form.password.length < 8) {
    errs.password = 'Password must be at least 8 characters';
  }
  if (!form.role) errs.role = 'Role is required';
  return errs;
}

export default function StaffFormPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const isEdit    = Boolean(id);
  const qc        = useQueryClient();
  const populated = useRef(false);
  const { user: authUser, isAdmin } = useAuth();
  const isEditingSelf = isEdit && String(authUser?.id) === String(id);
  const showPassword  = !isEdit || isEditingSelf;

  const [form, setForm]           = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const { data: staffRes, isLoading: loadingStaff } = useQuery({
    queryKey: ['staff', id],
    queryFn: () => staffApi.get(id),
    enabled: isEdit,
  });

  const { data: rolesRes } = useQuery({
    queryKey: ['roles-list'],
    queryFn: () => staffApi.getRoles(),
  });

  const { data: shopsRes } = useQuery({
    queryKey: ['shops-dropdown'],
    queryFn: () => staffApi.getShops(),
  });

  const staff = staffRes?.data ?? staffRes;
  const roles = rolesRes?.data ?? [];
  const shops = Array.isArray(shopsRes) ? shopsRes : (shopsRes?.data ?? []);
  const assignableRoles = roles.filter((r) => !['customer', 'corporate'].includes(r.name));

  useEffect(() => {
    if (!staff || populated.current) return;
    populated.current = true;
    setForm({
      first_name:         staff.first_name         ?? '',
      last_name:          staff.last_name          ?? '',
      email:              staff.email              ?? '',
      phone:              staff.phone              ?? '',
      phone_country_code: staff.phone_country_code ?? '+880',
      date_of_birth:      staff.date_of_birth      ?? '',
      gender:             staff.gender             ?? '',
      password:           '',
      role:               staff.roles?.[0]         ?? '',
      staff_shop_id:      String(staff.staff_shop_id ?? staff.shop?.id ?? ''),
      nid:                staff.nid                ?? '',
      status:             staff.status             ?? 'active',
      bio:                staff.bio                ?? '',
    });
  }, [staff]);

  const handleError = (err) => {
    const msg    = err?.response?.data?.message ?? 'Save failed';
    const errors = err?.response?.data?.errors ?? {};
    if (Object.keys(errors).length) setFieldErrors(errors);
    toast('error', msg);
  };

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: (data) => staffApi.create(data),
    onSuccess: (res) => {
      toast(res?.status ?? 'success', res?.message ?? 'Staff member created');
      qc.invalidateQueries({ queryKey: ['staff'] });
      navigate('/staff');
    },
    onError: handleError,
  });

  const { mutate: update, isPending: updating } = useMutation({
    mutationFn: (data) => staffApi.update(id, data),
    onSuccess: (res) => {
      toast(res?.status ?? 'success', res?.message ?? 'Staff member updated');
      qc.invalidateQueries({ queryKey: ['staff'] });
      qc.invalidateQueries({ queryKey: ['staff', id] });
      navigate('/staff');
    },
    onError: handleError,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const localErrs = validateForm(form, isEdit, showPassword);
    if (Object.keys(localErrs).length) { setFieldErrors(localErrs); return; }
    setFieldErrors({});

    const payload = { ...form };
    if (!showPassword || !payload.password) delete payload.password;
    if (!payload.staff_shop_id) payload.staff_shop_id = null;
    if (!payload.nid) payload.nid = null;
    if (!payload.date_of_birth) payload.date_of_birth = null;
    if (!payload.gender) payload.gender = null;

    if (isEdit) update(payload);
    else create(payload);
  };

  if (isEdit && loadingStaff) return <LoadingSpinner />;

  const isPending = creating || updating;
  const fe = fieldErrors;

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Staff Member' : 'Add Staff Member'}
        breadcrumb={[
          { label: 'Home', to: '/' },
          { label: 'Staff', to: '/staff' },
          { label: isEdit ? 'Edit' : 'Add' },
        ]}
        actionLabel="Back to Staff"
        actionTo="/staff"
        actionIcon="fa-arrow-left"
      />

      <form onSubmit={handleSubmit} noValidate>
        <div className="row g-4">
          {/* Left — Personal Details */}
          <div className="col-md-7">
            <div className="card">
              <div className="card-header py-2"><strong>Personal Details</strong></div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">First Name <span className="text-danger">*</span></label>
                    <input
                      className={`form-control${fe.first_name ? ' is-invalid' : ''}`}
                      value={form.first_name}
                      onChange={(e) => set('first_name', e.target.value)}
                      placeholder="First name"
                    />
                    <FieldError errors={fe} field="first_name" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Last Name</label>
                    <input
                      className={`form-control${fe.last_name ? ' is-invalid' : ''}`}
                      value={form.last_name}
                      onChange={(e) => set('last_name', e.target.value)}
                      placeholder="Last name"
                    />
                    <FieldError errors={fe} field="last_name" />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Email <span className="text-danger">*</span></label>
                    <input
                      className={`form-control${fe.email ? ' is-invalid' : ''}`}
                      type="email"
                      value={form.email}
                      onChange={(e) => set('email', e.target.value)}
                      placeholder="staff@example.com"
                    />
                    <FieldError errors={fe} field="email" />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Phone</label>
                    <PhoneInput
                      countryCode={form.phone_country_code}
                      phone={form.phone}
                      onCountryChange={(v) => set('phone_country_code', v)}
                      onPhoneChange={(v) => set('phone', v)}
                      error={fe.phone}
                    />
                    <FieldError errors={fe} field="phone" />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Date of Birth</label>
                    <input
                      className={`form-control${fe.date_of_birth ? ' is-invalid' : ''}`}
                      type="date"
                      value={form.date_of_birth}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={(e) => set('date_of_birth', e.target.value)}
                    />
                    <FieldError errors={fe} field="date_of_birth" />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Gender</label>
                    <select
                      className="form-select"
                      value={form.gender}
                      onChange={(e) => set('gender', e.target.value)}
                    >
                      <option value="">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      NID / Passport No
                      <span className="text-muted fw-normal ms-1" style={{ fontSize: '0.75rem' }}>(10, 13, or 17 digits)</span>
                    </label>
                    <input
                      className={`form-control${fe.nid ? ' is-invalid' : ''}`}
                      value={form.nid}
                      inputMode="numeric"
                      onChange={(e) => set('nid', e.target.value.replace(/\D/g, '').slice(0, 17))}
                      placeholder="National ID number"
                    />
                    <FieldError errors={fe} field="nid" />
                  </div>

                  {showPassword && (
                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        Password {isEdit && <span className="text-muted fw-normal">(leave blank to keep current)</span>}
                        {!isEdit && <span className="text-danger">*</span>}
                      </label>
                      <PasswordInput
                        value={form.password}
                        onChange={(e) => set('password', e.target.value)}
                        placeholder={isEdit ? 'Enter new password to change' : 'Min. 8 characters'}
                        required={!isEdit}
                        error={fe.password}
                      />
                      <FieldError errors={fe} field="password" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right — Access & Assignment */}
          <div className="col-md-5">
            <div className="card">
              <div className="card-header py-2"><strong>Access & Assignment</strong></div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-semibold">Role <span className="text-danger">*</span></label>
                    <select
                      className={`form-select${fe.role ? ' is-invalid' : ''}`}
                      value={form.role}
                      onChange={(e) => set('role', e.target.value)}
                    >
                      <option value="">Select role</option>
                      {assignableRoles.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </option>
                      ))}
                    </select>
                    <FieldError errors={fe} field="role" />
                    <div className="form-text">Role determines what this staff member can access.</div>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Assigned Branch</label>
                    <select
                      className="form-select"
                      value={form.staff_shop_id}
                      onChange={(e) => set('staff_shop_id', e.target.value)}
                    >
                      <option value="">All branches / No restriction</option>
                      {shops.map((s) => (
                        <option key={s.id} value={String(s.id)}>{s.name}</option>
                      ))}
                    </select>
                    <div className="form-text">Leave blank for access to all branches.</div>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Status</label>
                    <select
                      className="form-select"
                      value={form.status}
                      onChange={(e) => set('status', e.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {form.role && (
              <div className="card mt-3 border-primary">
                <div className="card-body py-2 px-3">
                  <small className="text-muted d-block mb-1">Permissions for selected role</small>
                  {assignableRoles.find((r) => r.name === form.role)?.permissions?.length ? (
                    <div className="d-flex flex-wrap gap-1">
                      {assignableRoles.find((r) => r.name === form.role).permissions.map((p) => (
                        <span key={p} className="badge bg-light text-dark border" style={{ fontSize: '0.68rem' }}>{p}</span>
                      ))}
                    </div>
                  ) : (
                    <small className="text-muted">No permissions assigned to this role yet.</small>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="d-flex gap-2 mt-4">
          <button type="submit" className="btn btn-primary" disabled={isPending}>
            {isPending ? 'Saving…' : (isEdit ? 'Update Staff Member' : 'Create Staff Member')}
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/staff')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
