import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import PageHeader from '../../../shared/components/PageHeader';
import AppModal from '../../../shared/components/AppModal';
import ConfirmDialog from '../../../shared/components/ConfirmDialog';
import { SkeletonTable } from '../../../shared/components/Skeleton';
import { rolesApi } from '../api';
import { useAuth } from '../../../shared/hooks/useAuth';

const PROTECTED = ['admin', 'customer', 'corporate'];

const toast = (icon, title) =>
  Swal.fire({ toast: true, position: 'top-end', icon, title, timer: 1400, showConfirmButton: false });

export default function RolesListPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [showCreate, setShowCreate]     = useState(false);
  const [newName, setNewName]           = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [renamingId, setRenamingId]     = useState(null);
  const [renameValue, setRenameValue]   = useState('');

  const { data: rolesRes, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.list(),
  });

  const roles = rolesRes?.data ?? [];

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: (name) => rolesApi.create({ name }),
    onSuccess: (res) => {
      toast('success', res?.message ?? 'Role created');
      qc.invalidateQueries({ queryKey: ['roles'] });
      setShowCreate(false);
      setNewName('');
      // Navigate to the new role's permission editor
      if (res?.data?.id) navigate(`/roles/${res.data.id}`);
    },
    onError: (err) => toast('error', err?.response?.data?.message ?? 'Failed to create role'),
  });

  const { mutate: rename, isPending: renaming } = useMutation({
    mutationFn: ({ id, name }) => rolesApi.update(id, { name }),
    onSuccess: (res) => {
      toast('success', res?.message ?? 'Role renamed');
      qc.invalidateQueries({ queryKey: ['roles'] });
      setRenamingId(null);
      setRenameValue('');
    },
    onError: (err) => toast('error', err?.response?.data?.message ?? 'Rename failed'),
  });

  const { mutate: remove, isPending: deleting } = useMutation({
    mutationFn: (id) => rolesApi.remove(id),
    onSuccess: (res) => {
      toast('success', res?.message ?? 'Role deleted');
      qc.invalidateQueries({ queryKey: ['roles'] });
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast('error', err?.response?.data?.message ?? 'Failed to delete role');
      setDeleteTarget(null);
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    create(newName.trim().toLowerCase().replace(/\s+/g, '_'));
  };

  if (isLoading) return <SkeletonTable rows={6} cols={4} />;

  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Roles' }]}
        actionLabel={isAdmin ? 'New Role' : undefined}
        onAction={isAdmin ? () => setShowCreate(true) : undefined}
        actionIcon="fa-plus"
      />

      <div className="row g-3">
        {roles.map((role) => (
          <div key={role.id} className="col-md-6 col-lg-4">
            <div className={`card h-100${role.is_protected ? ' border-primary' : ''}`}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="flex-grow-1 me-2">
                    {renamingId === role.id ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const normalized = renameValue.trim().toLowerCase().replace(/\s+/g, '_');
                          if (normalized) rename({ id: role.id, name: normalized });
                        }}
                        className="d-flex gap-1 align-items-center"
                      >
                        <input
                          className="form-control form-control-sm"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          autoFocus
                          placeholder="new_role_name"
                        />
                        <button type="submit" className="btn btn-sm btn-success" disabled={renaming}>
                          <i className="fa-solid fa-check" />
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { setRenamingId(null); setRenameValue(''); }}>
                          <i className="fa-solid fa-xmark" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <h6 className="mb-0 text-capitalize fw-semibold">
                          {role.name.replace(/_/g, ' ')}
                          {role.is_protected && (
                            <i className="fa-solid fa-shield fa-xs text-primary ms-1" title="Protected role — cannot be renamed" />
                          )}
                        </h6>
                        <small className="text-muted">{role.permissions_count} permission{role.permissions_count !== 1 ? 's' : ''}</small>
                      </>
                    )}
                  </div>
                  {renamingId !== role.id && (
                    <div className="d-flex gap-1">
                      {isAdmin && !role.is_protected && (
                        <button
                          className="btn btn-sm btn-outline-secondary btn-icon"
                          title="Rename role"
                          onClick={() => { setRenamingId(role.id); setRenameValue(role.name); }}
                        >
                          <i className="fa-solid fa-pencil" />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          className="btn btn-sm btn-outline-primary btn-icon"
                          title="Edit permissions"
                          onClick={() => navigate(`/roles/${role.id}`)}
                        >
                          <i className="fa-solid fa-sliders" />
                        </button>
                      )}
                      {isAdmin && !role.is_protected && (
                        <button
                          className="btn btn-sm btn-outline-danger btn-icon"
                          title="Delete role"
                          onClick={() => setDeleteTarget(role)}
                        >
                          <i className="fa-solid fa-trash" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {role.permissions?.length > 0 && (
                  <div className="d-flex flex-wrap gap-1 mt-2">
                    {role.permissions.slice(0, 6).map((p) => (
                      <span key={p} className="badge bg-light text-dark border" style={{ fontSize: '0.68rem' }}>{p}</span>
                    ))}
                    {role.permissions.length > 6 && (
                      <span className="badge bg-secondary" style={{ fontSize: '0.68rem' }}>+{role.permissions.length - 6} more</span>
                    )}
                  </div>
                )}
              </div>
              {isAdmin && (
                <div className="card-footer bg-transparent py-2">
                  <button
                    className="btn btn-sm btn-outline-primary w-100"
                    onClick={() => navigate(`/roles/${role.id}`)}
                  >
                    <i className="fa-solid fa-sliders me-1" /> Manage Permissions
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create role modal */}
      <AppModal
        show={showCreate}
        title="Create New Role"
        onHide={() => { setShowCreate(false); setNewName(''); }}
        onSubmit={handleCreate}
        submitLabel="Create Role"
        isLoading={creating}
        size="sm"
      >
        <form onSubmit={handleCreate}>
          <label className="form-label fw-semibold">Role Name <span className="text-danger">*</span></label>
          <input
            className="form-control"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. warehouse_manager"
            required
            autoFocus
          />
          <div className="form-text">Use lowercase with underscores. Will be normalized automatically.</div>
        </form>
      </AppModal>

      <ConfirmDialog
        show={Boolean(deleteTarget)}
        title="Delete Role?"
        message={`Delete role "${deleteTarget?.name?.replace(/_/g, ' ')}"? Staff assigned this role will lose their access.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
        onConfirm={() => remove(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
