import { useState } from 'react';
import Swal from 'sweetalert2';
import PageHeader from '../../../shared/components/PageHeader';
import DataTable from '../../../shared/components/DataTable';
import AppModal from '../../../shared/components/AppModal';
import ConfirmDialog from '../../../shared/components/ConfirmDialog';
import { useTableParams } from '../../../shared/hooks/useTableParams';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { formatDate } from '../../../shared/utils/formatters';
import { useAuth } from '../../../shared/hooks/useAuth';
import {
  useAttributes,
  useCreateAttribute,
  useUpdateAttribute,
  useDeleteAttribute,
  useCreateAttributeValue,
  useUpdateAttributeValue,
  useDeleteAttributeValue,
} from '../api';

const toast = (icon, title) =>
  Swal.fire({ toast: true, position: 'top-end', icon, title, timer: 1400, showConfirmButton: false });

const EMPTY_ATTR  = { name: '', status: 1 };
const EMPTY_VALUE = { name: '', status: 1 };

export default function ProductAttributesPage() {
  const { hasPermission, isAdmin } = useAuth();
  const canManage = isAdmin || hasPermission('attributes.manage');

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 400);
  const { params, setPage, setSort } = useTableParams({ orderBy: 'id', direction: 'desc', perPage: 15 });

  const queryParams = {
    page: params.page,
    per_page: params.per_page,
    order_by: params.order_by,
    direction: params.direction,
    search: debouncedSearch || undefined,
  };

  const { data, isLoading } = useAttributes(queryParams);
  const attributes = data?.data ?? [];
  const meta       = data?.meta ?? null;

  const createAttr  = useCreateAttribute();
  const updateAttr  = useUpdateAttribute();
  const deleteAttr  = useDeleteAttribute();
  const createValue = useCreateAttributeValue();
  const updateValue = useUpdateAttributeValue();
  const deleteValue = useDeleteAttributeValue();

  // Attribute modal state
  const [attrModal,  setAttrModal]  = useState({ show: false, data: null });
  const [attrForm,   setAttrForm]   = useState(EMPTY_ATTR);
  const [deleteAttrTarget, setDeleteAttrTarget] = useState(null);

  // Attribute Value modal state
  const [valueModal,  setValueModal]  = useState({ show: false, attr: null, data: null });
  const [valueForm,   setValueForm]   = useState(EMPTY_VALUE);
  const [deleteValueTarget, setDeleteValueTarget] = useState(null);

  // Values view modal
  const [viewModal, setViewModal] = useState({ show: false, attr: null });

  // ── Attribute handlers ──────────────────────────────────────────────────
  const openCreateAttr = () => { setAttrForm(EMPTY_ATTR); setAttrModal({ show: true, data: null }); };
  const openEditAttr   = (row) => { setAttrForm({ name: row.name, status: row.status }); setAttrModal({ show: true, data: row }); };

  const handleSaveAttr = async () => {
    if (!attrForm.name.trim()) return toast('warning', 'Name is required');
    try {
      const res = attrModal.data
        ? await updateAttr.mutateAsync({ id: attrModal.data.id, ...attrForm })
        : await createAttr.mutateAsync(attrForm);
      toast(res.status, res.message);
      setAttrModal({ show: false, data: null });
    } catch {
      toast('error', 'Something went wrong');
    }
  };

  const handleDeleteAttr = async () => {
    try {
      const res = await deleteAttr.mutateAsync(deleteAttrTarget.id);
      toast(res.status, res.message);
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Something went wrong';
      toast('error', msg);
    } finally {
      setDeleteAttrTarget(null);
    }
  };

  // ── Value handlers ──────────────────────────────────────────────────────
  const openCreateValue = (attr) => { setValueForm(EMPTY_VALUE); setValueModal({ show: true, attr, data: null }); };
  const openEditValue   = (attr, val) => { setValueForm({ name: val.name, status: val.status }); setValueModal({ show: true, attr, data: val }); };

  const handleSaveValue = async () => {
    if (!valueForm.name.trim()) return toast('warning', 'Value name is required');
    try {
      const res = valueModal.data
        ? await updateValue.mutateAsync({ id: valueModal.data.id, ...valueForm })
        : await createValue.mutateAsync({ attribute_id: valueModal.attr.id, ...valueForm });
      toast(res.status, res.message);
      setValueModal({ show: false, attr: null, data: null });
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Something went wrong';
      toast('error', msg);
    }
  };

  const handleDeleteValue = async () => {
    try {
      const res = await deleteValue.mutateAsync(deleteValueTarget.id);
      toast(res.status, res.message);
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Something went wrong';
      toast('error', msg);
    } finally {
      setDeleteValueTarget(null);
    }
  };

  // ── Columns ─────────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'name',
      label: 'Attribute Name',
      sortable: true,
      render: (row) => <span className="fw-semibold">{row.name}</span>,
    },
    {
      label: 'Values',
      render: (row) => {
        // API returns key "value" (not "values")
        const vals = row.value ?? [];
        return (
          <div className="d-flex flex-wrap gap-1">
            {vals.slice(0, 4).map((v) => (
              <span key={v.id} className={`badge ${v.status ? 'bg-light text-dark border' : 'bg-secondary'}`}>
                {v.name}
              </span>
            ))}
            {vals.length > 4 && (
              <button
                className="badge bg-primary border-0"
                style={{ cursor: 'pointer' }}
                onClick={() => setViewModal({ show: true, attr: row })}
              >
                +{vals.length - 4} more
              </button>
            )}
            {vals.length === 0 && <span className="text-muted small">No values</span>}
          </div>
        );
      },
    },
    {
      label: 'Status',
      className: 'text-center',
      render: (row) => (
        <span className={`badge ${row.status ? 'bg-success' : 'bg-secondary'}`}>
          {row.status ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'created_by',
      label: 'Created By',
      render: (row) => <small className="text-muted">{row.created_by}</small>,
    },
    {
      key: 'created_at',
      label: 'Date',
      sortable: true,
      render: (row) => <small className="text-muted">{formatDate(row.created_at)}</small>,
    },
    {
      label: 'Actions',
      className: 'text-center',
      render: (row) => (
        <div className="d-flex gap-1 justify-content-center">
          <button className="btn btn-sm btn-outline-info btn-icon" title="View values" onClick={() => setViewModal({ show: true, attr: row })}>
            <i className="fa-solid fa-eye" />
          </button>
          {canManage && (
            <button className="btn btn-sm btn-outline-success btn-icon" title="Add value" onClick={() => openCreateValue(row)}>
              <i className="fa-solid fa-tag" />
            </button>
          )}
          {canManage && (
            <button className="btn btn-sm btn-outline-primary btn-icon" title="Edit attribute" onClick={() => openEditAttr(row)}>
              <i className="fa-solid fa-pen" />
            </button>
          )}
          {canManage && (
            <button className="btn btn-sm btn-outline-danger btn-icon" title="Delete attribute" onClick={() => setDeleteAttrTarget(row)}>
              <i className="fa-solid fa-trash" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const attrSaving  = createAttr.isPending || updateAttr.isPending;
  const valueSaving = createValue.isPending || updateValue.isPending;

  return (
    <div>
      <PageHeader
        title="Product Attributes"
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Product Attributes' }]}
        actionLabel={canManage ? 'Add Attribute' : undefined}
        onAction={canManage ? openCreateAttr : undefined}
      />

      <div className="card">
        <div className="card-body">
          <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
            <div className="input-group" style={{ maxWidth: 280 }}>
              <span className="input-group-text"><i className="fa-solid fa-magnifying-glass" /></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search attributes…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={attributes}
            isLoading={isLoading}
            meta={meta}
            onPageChange={setPage}
            orderBy={params.order_by}
            direction={params.direction}
            onSort={setSort}
            emptyText="No attributes found."
          />
        </div>
      </div>

      {/* ── Add/Edit Attribute Modal ────────────────────────────────────── */}
      <AppModal
        show={attrModal.show}
        title={attrModal.data ? 'Edit Attribute' : 'Add Attribute'}
        onHide={() => setAttrModal({ show: false, data: null })}
        onSubmit={handleSaveAttr}
        submitLabel={attrModal.data ? 'Update' : 'Save'}
        isLoading={attrSaving}
        size="sm"
      >
        <div className="mb-3">
          <label className="form-label">Attribute Name <span className="text-danger">*</span></label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Color, Size, Material"
            value={attrForm.name}
            onChange={(e) => setAttrForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div className="mb-2">
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={attrForm.status}
            onChange={(e) => setAttrForm((f) => ({ ...f, status: Number(e.target.value) }))}
          >
            <option value={1}>Active</option>
            <option value={0}>Inactive</option>
          </select>
        </div>
      </AppModal>

      {/* ── Add/Edit Attribute Value Modal ─────────────────────────────── */}
      <AppModal
        show={valueModal.show}
        title={valueModal.data ? `Edit Value — ${valueModal.attr?.name}` : `Add Value — ${valueModal.attr?.name}`}
        onHide={() => setValueModal({ show: false, attr: null, data: null })}
        onSubmit={handleSaveValue}
        submitLabel={valueModal.data ? 'Update' : 'Add'}
        isLoading={valueSaving}
        size="sm"
      >
        <div className="mb-3">
          <label className="form-label">Value Name <span className="text-danger">*</span></label>
          <input
            type="text"
            className="form-control"
            placeholder={`e.g. ${valueModal.attr?.name === 'Color' ? 'Red, Blue…' : valueModal.attr?.name === 'Size' ? 'Small, Medium…' : 'value'}`}
            value={valueForm.name}
            onChange={(e) => setValueForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div className="mb-2">
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={valueForm.status}
            onChange={(e) => setValueForm((f) => ({ ...f, status: Number(e.target.value) }))}
          >
            <option value={1}>Active</option>
            <option value={0}>Inactive</option>
          </select>
        </div>
      </AppModal>

      {/* ── View Attribute Values Modal ─────────────────────────────────── */}
      <AppModal
        show={viewModal.show}
        title={`Values — ${viewModal.attr?.name}`}
        onHide={() => setViewModal({ show: false, attr: null })}
        size="md"
      >
        {viewModal.attr && (
          <div>
            <div className="d-flex justify-content-end mb-2">
              {canManage && (
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => { setViewModal({ show: false, attr: null }); openCreateValue(viewModal.attr); }}
                >
                  <i className="fa-solid fa-plus me-1" />Add Value
                </button>
              )}
            </div>
            <table className="table table-sm table-bordered table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 40 }}>SL</th>
                  <th>Value Name</th>
                  <th className="text-center" style={{ width: 90 }}>Status</th>
                  <th className="text-center" style={{ width: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(viewModal.attr.value ?? []).length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-muted py-3">No values added yet.</td></tr>
                ) : (viewModal.attr.value ?? []).map((v, i) => (
                  <tr key={v.id}>
                    <td>{i + 1}</td>
                    <td>{v.name}</td>
                    <td className="text-center">
                      <span className={`badge ${v.status ? 'bg-success' : 'bg-secondary'}`}>
                        {v.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="d-flex gap-1 justify-content-center">
                        {canManage && (
                          <button
                            className="btn btn-sm btn-outline-primary btn-icon"
                            title="Edit"
                            onClick={() => { setViewModal({ show: false, attr: null }); openEditValue(viewModal.attr, v); }}
                          >
                            <i className="fa-solid fa-pen" />
                          </button>
                        )}
                        {canManage && (
                          <button className="btn btn-sm btn-outline-danger btn-icon" title="Delete" onClick={() => setDeleteValueTarget(v)}>
                            <i className="fa-solid fa-trash" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AppModal>

      {/* ── Confirm Dialogs ─────────────────────────────────────────────── */}
      <ConfirmDialog
        show={Boolean(deleteAttrTarget)}
        title="Delete Attribute?"
        message={`Remove "${deleteAttrTarget?.name}" and all its values? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteAttr.isPending}
        onConfirm={handleDeleteAttr}
        onCancel={() => setDeleteAttrTarget(null)}
      />

      <ConfirmDialog
        show={Boolean(deleteValueTarget)}
        title="Delete Value?"
        message={`Remove "${deleteValueTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteValue.isPending}
        onConfirm={handleDeleteValue}
        onCancel={() => setDeleteValueTarget(null)}
      />
    </div>
  );
}
