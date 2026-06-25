import { useState, useEffect } from 'react';
import PageHeader from '../../../shared/components/PageHeader';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import { useSettings, useUpdateSettings } from '../api';
import { useAuth } from '../../../shared/hooks/useAuth';

const GROUP_LABELS = {
  general: { label: 'General', icon: 'fa-solid fa-globe' },
  orders: { label: 'Orders', icon: 'fa-solid fa-receipt' },
  inventory: { label: 'Inventory', icon: 'fa-solid fa-boxes-stacked' },
  shipping: { label: 'Shipping', icon: 'fa-solid fa-truck' },
  notifications: { label: 'Notifications', icon: 'fa-solid fa-bell' },
};

const GROUP_ORDER = ['general', 'orders', 'inventory', 'shipping', 'notifications'];

function SettingField({ setting, value, onChange }) {
  if (setting.type === 'boolean') {
    return (
      <div className="form-check form-switch">
        <input
          className="form-check-input"
          type="checkbox"
          id={`setting-${setting.key}`}
          checked={value === '1' || value === true || value === 1}
          onChange={(e) => onChange(setting.key, e.target.checked ? '1' : '0')}
        />
      </div>
    );
  }

  if (setting.type === 'integer') {
    return (
      <input
        className="form-control form-control-sm"
        style={{ maxWidth: 160 }}
        type="number"
        id={`setting-${setting.key}`}
        value={value ?? ''}
        onChange={(e) => onChange(setting.key, e.target.value)}
        min={0}
      />
    );
  }

  return (
    <input
      className="form-control form-control-sm"
      style={{ maxWidth: 340 }}
      type="text"
      id={`setting-${setting.key}`}
      value={value ?? ''}
      onChange={(e) => onChange(setting.key, e.target.value)}
    />
  );
}

export default function SystemSettingsPage() {
  const { isAdmin } = useAuth();
  const { data: settingsData, isLoading } = useSettings();
  const updateMut = useUpdateSettings();

  const [dirty, setDirty] = useState({});
  const [activeTab, setActiveTab] = useState('general');

  const grouped = settingsData?.data ?? settingsData ?? {};

  // Keep a local copy of all values merged with dirty overrides
  const allValues = {};
  GROUP_ORDER.forEach((g) => {
    (grouped[g] ?? []).forEach((s) => {
      allValues[s.key] = Object.prototype.hasOwnProperty.call(dirty, s.key)
        ? dirty[s.key]
        : s.value;
    });
  });

  const handleChange = (key, val) => {
    setDirty((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = (groupKey) => {
    const group = grouped[groupKey] ?? [];
    const patch = {};
    group.forEach((s) => {
      if (Object.prototype.hasOwnProperty.call(dirty, s.key)) {
        patch[s.key] = dirty[s.key];
      }
    });
    if (Object.keys(patch).length === 0) return;
    updateMut.mutate(patch, {
      onSuccess: () => {
        setDirty((prev) => {
          const next = { ...prev };
          group.forEach((s) => delete next[s.key]);
          return next;
        });
      },
    });
  };

  const groupHasDirty = (groupKey) =>
    (grouped[groupKey] ?? []).some((s) => Object.prototype.hasOwnProperty.call(dirty, s.key));

  if (!isAdmin) return (
    <div className="text-center py-5 text-muted">
      <i className="fa-solid fa-lock fa-2x mb-2 d-block opacity-25" />
      System settings are restricted to administrators.
    </div>
  );
  if (isLoading) return <LoadingSpinner fullPage />;

  const availableGroups = GROUP_ORDER.filter((g) => (grouped[g] ?? []).length > 0);

  return (
    <div className="app-content">
      <PageHeader
        title="System Settings"
        breadcrumb={[{ label: 'Admin' }, { label: 'Settings' }]}
      />

      <div className="row g-0">
        {/* Tab sidebar */}
        <div className="col-auto" style={{ width: 200 }}>
          <div className="card border-0 shadow-sm h-100">
            <div className="list-group list-group-flush">
              {availableGroups.map((g) => {
                const meta = GROUP_LABELS[g] ?? { label: g, icon: 'fa-solid fa-gear' };
                const isDirty = groupHasDirty(g);
                return (
                  <button
                    key={g}
                    type="button"
                    className={`list-group-item list-group-item-action d-flex align-items-center gap-2 border-0 ${activeTab === g ? 'active' : ''}`}
                    style={{ fontSize: '0.82rem', padding: '10px 16px' }}
                    onClick={() => setActiveTab(g)}
                  >
                    <i className={meta.icon} style={{ width: 16, fontSize: '0.8rem', opacity: 0.7 }} />
                    <span>{meta.label}</span>
                    {isDirty && (
                      <span className="ms-auto" style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Settings panel */}
        <div className="col ps-3">
          {availableGroups.map((g) => {
            if (g !== activeTab) return null;
            const meta = GROUP_LABELS[g] ?? { label: g, icon: 'fa-solid fa-gear' };
            const settings = grouped[g] ?? [];
            const isDirty = groupHasDirty(g);

            return (
              <div key={g} className="card border-0 shadow-sm">
                <div className="card-header d-flex align-items-center justify-content-between" style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 20px' }}>
                  <div className="d-flex align-items-center gap-2">
                    <i className={meta.icon} style={{ color: '#2563eb', fontSize: '0.9rem' }} />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{meta.label}</span>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!isDirty || updateMut.isPending}
                    onClick={() => handleSave(g)}
                  >
                    {updateMut.isPending ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
                <div className="card-body p-0">
                  <table className="table mb-0" style={{ fontSize: '0.83rem' }}>
                    <tbody>
                      {settings.map((s, i) => (
                        <tr key={s.key} style={{ borderBottom: i < settings.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                          <td style={{ padding: '14px 20px', width: '40%' }}>
                            <label
                              htmlFor={`setting-${s.key}`}
                              style={{ fontWeight: 500, color: '#111827', display: 'block', marginBottom: 2, cursor: 'pointer' }}
                            >
                              {s.label}
                            </label>
                            {s.description && (
                              <span style={{ fontSize: '0.74rem', color: '#9ca3af' }}>{s.description}</span>
                            )}
                          </td>
                          <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                            <SettingField
                              setting={s}
                              value={allValues[s.key]}
                              onChange={handleChange}
                            />
                          </td>
                          <td style={{ padding: '14px 20px', width: 24, verticalAlign: 'middle' }}>
                            {Object.prototype.hasOwnProperty.call(dirty, s.key) && (
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} title="Unsaved change" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
