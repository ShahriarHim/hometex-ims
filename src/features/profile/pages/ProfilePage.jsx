import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../../shared/components/PageHeader';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import PhoneInput from '../../../shared/components/PhoneInput';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useUpdateProfile } from '../api';

const NID_VALID_LENGTHS = [10, 13, 17];
const EMPTY_PW = { current_password: '', new_password: '', new_password_confirmation: '' };

function validateNid(nid) {
  if (!nid) return null;
  if (!/^\d+$/.test(nid)) return 'NID must contain digits only';
  if (!NID_VALID_LENGTHS.includes(nid.length)) return 'NID must be 10, 13, or 17 digits';
  return null;
}

function validateEmail(email) {
  if (!email) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address';
  return null;
}

export default function ProfilePage() {
  const { user, photoUrl, isLoading } = useAuth();
  const update = useUpdateProfile();

  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '', phone_country_code: '+880',
    date_of_birth: '', gender: '', nid: '',
  });
  const [pw, setPw]               = useState(EMPTY_PW);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarB64, setAvatarB64] = useState(null);
  const [errors, setErrors]       = useState({});
  const fileRef   = useRef(null);
  const populated = useRef(false);

  useEffect(() => {
    if (user && !populated.current) {
      setForm({
        first_name:         user.first_name         ?? '',
        last_name:          user.last_name          ?? '',
        phone:              user.phone              ?? '',
        phone_country_code: user.phone_country_code ?? '+880',
        date_of_birth:      user.date_of_birth      ?? '',
        gender:             user.gender             ?? '',
        nid:                user.nid                ?? '',
      });
      populated.current = true;
    }
  }, [user]);

  if (isLoading) return <LoadingSpinner fullPage />;

  const set = (field, val) => {
    setForm((p) => ({ ...p, [field]: val }));
    if (errors[field]) setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
  };
  const setPwField = (field, val) => setPw((p) => ({ ...p, [field]: val }));

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setAvatarPreview(ev.target.result); setAvatarB64(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const localErrs = {};
    const nidErr = validateNid(form.nid);
    if (nidErr) localErrs.nid = [nidErr];
    if (form.phone && !/^\d+$/.test(form.phone)) localErrs.phone = ['Phone must contain digits only'];
    if (pw.new_password && pw.new_password.length < 8) localErrs.new_password = ['Password must be at least 8 characters'];
    if (pw.new_password && pw.new_password !== pw.new_password_confirmation) localErrs.new_password_confirmation = ['Passwords do not match'];
    if (Object.keys(localErrs).length) { setErrors(localErrs); return; }
    setErrors({});

    const payload = { ...form };
    if (avatarB64) payload.avatar = avatarB64;
    if (!payload.date_of_birth) payload.date_of_birth = null;
    if (!payload.gender) payload.gender = null;
    if (!payload.nid) payload.nid = null;
    if (pw.new_password) {
      payload.current_password           = pw.current_password;
      payload.new_password               = pw.new_password;
      payload.new_password_confirmation  = pw.new_password_confirmation;
    }

    update.mutate(payload, {
      onSuccess: () => setPw(EMPTY_PW),
      onError: (err) => {
        if (err?.response?.data?.errors) setErrors(err.response.data.errors);
      },
    });
  };

  const avatarSrc = avatarPreview ?? photoUrl ?? null;
  const initials  = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div className="app-content">
      <PageHeader title="My Profile" breadcrumb={[{ label: 'Profile' }]} />

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Avatar card */}
          <div className="col-lg-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex flex-column align-items-center py-4 gap-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center overflow-hidden"
                  style={{ width: 100, height: 100, background: '#2563eb', cursor: 'pointer', flexShrink: 0 }}
                  onClick={() => fileRef.current?.click()}
                  title="Click to change photo"
                >
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: '#fff', fontSize: '2rem', fontWeight: 700 }}>{initials}</span>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="d-none" onChange={handleAvatarChange} />
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => fileRef.current?.click()}>
                  <i className="fa-solid fa-camera me-1" />Change Photo
                </button>
                <div className="text-center mt-2">
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{user?.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{user?.email}</div>
                  <div className="mt-1">
                    {(user?.roles ?? []).map((r) => (
                      <span key={r} className="badge bg-primary me-1" style={{ fontSize: '0.7rem' }}>{r}</span>
                    ))}
                  </div>
                  {user?.branch && (
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>
                      <i className="fa-solid fa-store me-1" />{user.branch.name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-9">
            {/* Personal Information */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-4">
                <h6 className="fw-semibold mb-3" style={{ color: '#1e293b' }}>Personal Information</h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 500 }}>First Name</label>
                    <input
                      className={`form-control form-control-sm${errors.first_name ? ' is-invalid' : ''}`}
                      value={form.first_name}
                      onChange={(e) => set('first_name', e.target.value)}
                    />
                    {errors.first_name && <div className="invalid-feedback">{errors.first_name[0]}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 500 }}>Last Name</label>
                    <input
                      className={`form-control form-control-sm${errors.last_name ? ' is-invalid' : ''}`}
                      value={form.last_name}
                      onChange={(e) => set('last_name', e.target.value)}
                    />
                    {errors.last_name && <div className="invalid-feedback">{errors.last_name[0]}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 500 }}>Email</label>
                    <input
                      className="form-control form-control-sm"
                      value={user?.email ?? ''}
                      disabled
                      style={{ background: '#f8fafc', color: '#6b7280' }}
                    />
                    <div className="form-text" style={{ fontSize: '0.72rem' }}>Contact admin to change email.</div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 500 }}>Phone</label>
                    <PhoneInput
                      countryCode={form.phone_country_code}
                      phone={form.phone}
                      onCountryChange={(v) => set('phone_country_code', v)}
                      onPhoneChange={(v) => set('phone', v)}
                      error={errors.phone}
                    />
                    {errors.phone && <div className="invalid-feedback d-block">{errors.phone[0]}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 500 }}>Date of Birth</label>
                    <input
                      className={`form-control form-control-sm${errors.date_of_birth ? ' is-invalid' : ''}`}
                      type="date"
                      value={form.date_of_birth}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={(e) => set('date_of_birth', e.target.value)}
                    />
                    {errors.date_of_birth && <div className="invalid-feedback">{errors.date_of_birth[0]}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 500 }}>Gender</label>
                    <select
                      className="form-select form-select-sm"
                      value={form.gender}
                      onChange={(e) => set('gender', e.target.value)}
                    >
                      <option value="">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                      NID / Passport No
                      <span className="text-muted fw-normal ms-1" style={{ fontSize: '0.72rem' }}>(10, 13, or 17 digits)</span>
                    </label>
                    <input
                      className={`form-control form-control-sm${errors.nid ? ' is-invalid' : ''}`}
                      value={form.nid}
                      inputMode="numeric"
                      onChange={(e) => set('nid', e.target.value.replace(/\D/g, '').slice(0, 17))}
                      placeholder="National ID number"
                    />
                    {errors.nid && <div className="invalid-feedback">{errors.nid[0]}</div>}
                  </div>
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h6 className="fw-semibold mb-1" style={{ color: '#1e293b' }}>Change Password</h6>
                <p style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 16 }}>Leave blank to keep current password.</p>
                <div className="row g-3">
                  <div className="col-md-12">
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 500 }}>Current Password</label>
                    <input
                      type="password"
                      className={`form-control form-control-sm${errors.current_password ? ' is-invalid' : ''}`}
                      value={pw.current_password}
                      onChange={(e) => setPwField('current_password', e.target.value)}
                      autoComplete="current-password"
                    />
                    {errors.current_password && <div className="invalid-feedback">{errors.current_password[0]}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 500 }}>New Password</label>
                    <input
                      type="password"
                      className={`form-control form-control-sm${errors.new_password ? ' is-invalid' : ''}`}
                      value={pw.new_password}
                      onChange={(e) => setPwField('new_password', e.target.value)}
                      autoComplete="new-password"
                    />
                    {errors.new_password && <div className="invalid-feedback">{errors.new_password[0]}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 500 }}>Confirm New Password</label>
                    <input
                      type="password"
                      className={`form-control form-control-sm${errors.new_password_confirmation ? ' is-invalid' : ''}`}
                      value={pw.new_password_confirmation}
                      onChange={(e) => setPwField('new_password_confirmation', e.target.value)}
                      autoComplete="new-password"
                    />
                    {errors.new_password_confirmation && <div className="invalid-feedback">{errors.new_password_confirmation[0]}</div>}
                  </div>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end mt-3">
              <button type="submit" className="btn btn-primary btn-sm px-4" disabled={update.isPending}>
                {update.isPending
                  ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
                  : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
