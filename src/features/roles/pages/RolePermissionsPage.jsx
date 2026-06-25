import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import PageHeader from '../../../shared/components/PageHeader';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import { rolesApi } from '../api';

const toast = (icon, title) =>
  Swal.fire({ toast: true, position: 'top-end', icon, title, timer: 1400, showConfirmButton: false });

const MODULE_LABELS = {
  dashboard:     'Dashboard',
  products:      'Products',
  catalog:       'Catalog',
  attributes:    'Attributes',
  pricing:       'Pricing',
  inventory:     'Inventory',
  orders:        'Orders',
  store_orders:  'Store Orders',
  customers:     'Customers',
  returns:       'Returns',
  suppliers:     'Suppliers',
  shops:         'Shops',
  staff:         'Staff',
  approvals:     'Approvals',
  reports:       'Reports',
  analytics:     'Analytics',
  banners:       'Banners',
  barcode:       'Barcode',
  roles:         'Roles & Access',
};

export default function RolePermissionsPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const qc       = useQueryClient();

  const [selected, setSelected] = useState(new Set());
  const [dirty, setDirty]       = useState(false);

  const { data: roleRes, isLoading: loadingRole } = useQuery({
    queryKey: ['roles', id],
    queryFn: () => rolesApi.get(id),
  });

  const { data: allPermsRes, isLoading: loadingPerms } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => rolesApi.allPermissions(),
  });

  const role     = roleRes?.data;
  const modules  = allPermsRes?.data ?? [];

  useEffect(() => {
    if (!role) return;
    setSelected(new Set(role.permissions ?? []));
    setDirty(false);
  }, [role]);

  const { mutate: sync, isPending: saving } = useMutation({
    mutationFn: () => rolesApi.syncPermissions(id, Array.from(selected)),
    onSuccess: (res) => {
      toast('success', res?.message ?? 'Permissions saved');
      qc.invalidateQueries({ queryKey: ['roles'] });
      setDirty(false);
    },
    onError: (err) => toast('error', err?.response?.data?.message ?? 'Failed to save permissions'),
  });

  const toggle = (perm) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(perm) ? next.delete(perm) : next.add(perm);
      return next;
    });
    setDirty(true);
  };

  const toggleModule = (perms, allSelected) => {
    setSelected((prev) => {
      const next = new Set(prev);
      perms.forEach((p) => allSelected ? next.delete(p.name) : next.add(p.name));
      return next;
    });
    setDirty(true);
  };

  const selectAll = () => {
    const all = modules.flatMap((m) => m.permissions.map((p) => p.name));
    setSelected(new Set(all));
    setDirty(true);
  };

  const clearAll = () => {
    setSelected(new Set());
    setDirty(true);
  };

  if (loadingRole || loadingPerms) return <LoadingSpinner />;
  if (!role) return <div className="alert alert-danger">Role not found.</div>;

  const isProtected = role.is_protected;

  return (
    <div>
      <PageHeader
        title={`Edit Role: ${role.name.replace(/_/g, ' ')}`}
        breadcrumb={[
          { label: 'Home', to: '/' },
          { label: 'Roles', to: '/roles' },
          { label: role.name },
        ]}
        actionLabel="Back to Roles"
        actionTo="/roles"
        actionIcon="fa-arrow-left"
      />

      <div className="card">
        <div className="card-header py-2 d-flex justify-content-between align-items-center">
          <div>
            <strong className="text-capitalize">{role.name.replace(/_/g, ' ')}</strong>
            <span className="ms-2 text-muted small">{selected.size} permission{selected.size !== 1 ? 's' : ''} selected</span>
            {isProtected && (
              <span className="badge bg-primary ms-2" style={{ fontSize: '0.7rem' }}>Protected</span>
            )}
          </div>
          {!isProtected && (
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-outline-secondary" onClick={clearAll}>Clear All</button>
              <button className="btn btn-sm btn-outline-primary" onClick={selectAll}>Select All</button>
            </div>
          )}
        </div>

        <div className="card-body">
          {isProtected && (
            <div className="alert alert-info py-2 mb-3">
              <i className="fa-solid fa-shield me-1" />
              This is a protected role. Permissions are locked and cannot be changed.
            </div>
          )}

          <div className="row g-3">
            {modules.map((module) => {
              const modulePerms = module.permissions;
              const allSelected = modulePerms.every((p) => selected.has(p.name));
              const someSelected = !allSelected && modulePerms.some((p) => selected.has(p.name));

              return (
                <div key={module.module} className="col-md-6 col-lg-4">
                  <div className="card border">
                    <div className="card-header py-2 d-flex justify-content-between align-items-center bg-light">
                      <strong className="small text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>
                        {MODULE_LABELS[module.module] ?? module.module}
                      </strong>
                      {!isProtected && (
                        <div
                          className="form-check mb-0"
                          title={allSelected ? 'Deselect all' : 'Select all'}
                        >
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={allSelected}
                            ref={(el) => { if (el) el.indeterminate = someSelected; }}
                            onChange={() => toggleModule(modulePerms, allSelected)}
                            id={`module-${module.module}`}
                          />
                        </div>
                      )}
                    </div>
                    <div className="card-body py-2 px-3">
                      {modulePerms.map((p) => (
                        <div key={p.name} className="form-check mb-1">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id={`perm-${p.name}`}
                            checked={selected.has(p.name)}
                            onChange={() => toggle(p.name)}
                            disabled={isProtected}
                          />
                          <label
                            className="form-check-label small"
                            htmlFor={`perm-${p.name}`}
                            style={{ cursor: isProtected ? 'default' : 'pointer' }}
                          >
                            {p.name.split('.').slice(1).join('.').replace(/_/g, ' ')}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {!isProtected && (
          <div className="card-footer d-flex gap-2">
            <button
              className="btn btn-primary"
              onClick={() => sync()}
              disabled={saving || !dirty}
            >
              {saving ? 'Saving…' : 'Save Permissions'}
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate('/roles')}
            >
              Cancel
            </button>
            {dirty && (
              <span className="text-warning small d-flex align-items-center ms-2">
                <i className="fa-solid fa-triangle-exclamation me-1" />
                Unsaved changes
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
