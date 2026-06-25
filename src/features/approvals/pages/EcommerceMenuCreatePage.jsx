import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import PageHeader from '../../../shared/components/PageHeader';
import {
  useCreateCategory,
  useCreateSubCategory,
  useCreateChildSubCategory,
  useCategories,
  useSubCategories,
} from '../../catalog/api';

const toast = (icon, title) =>
  Swal.fire({ toast: true, position: 'top-end', icon, title, timer: 1400, showConfirmButton: false });

const slugify = (str) =>
  str.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

const EMPTY = { name: '', slug: '', parent_id: '', serial: '', status: 1 };

const LEVEL_LABELS = { 1: 'Root', 2: 'Sub', 3: 'Child' };

export default function EcommerceMenuCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialLevel = Number(searchParams.get('level')) || 1;
  const [level, setLevel] = useState(initialLevel);
  const [form, setForm] = useState(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);

  const createCategory      = useCreateCategory();
  const createSubCategory   = useCreateSubCategory();
  const createChildSub      = useCreateChildSubCategory();

  const { data: categoryOptions } = useCategories(
    { per_page: 1000, order_by: 'name', direction: 'asc' },
  );
  const { data: subCategoryOptions } = useSubCategories(
    { per_page: 1000, order_by: 'name', direction: 'asc' },
  );

  const rootOptions = categoryOptions?.data ?? [];
  const subOptions  = subCategoryOptions?.data ?? [];

  const mutation = level === 1 ? createCategory : level === 2 ? createSubCategory : createChildSub;
  const isSaving = mutation.isPending;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleNameChange = (e) => {
    const name = e.target.value;
    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
  };

  const handleSlugChange = (e) => {
    setSlugTouched(true);
    setForm((f) => ({ ...f, slug: e.target.value }));
  };

  const handleLevelChange = (e) => {
    setLevel(Number(e.target.value));
    setForm(EMPTY);
    setSlugTouched(false);
  };

  const buildBody = () => {
    const base = {
      name:   form.name.trim(),
      slug:   form.slug.trim(),
      serial: form.serial ? Number(form.serial) : undefined,
      status: form.status,
    };
    if (level === 2) return { ...base, category_id: Number(form.parent_id) };
    if (level === 3) return { ...base, sub_category_id: Number(form.parent_id) };
    return base;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast('warning', 'Menu name is required');
    if (!form.slug.trim()) return toast('warning', 'Slug is required');
    if (level > 1 && !form.parent_id) return toast('warning', 'Parent is required');

    mutation.mutate(buildBody(), {
      onSuccess: (res) => {
        toast(res?.status ?? 'success', res?.message ?? 'Created');
        navigate('/ecommerce/menu-list');
      },
      onError: (err) => {
        const msg = err?.response?.data?.message ?? 'Failed to create menu item.';
        toast('error', msg);
      },
    });
  };

  return (
    <div>
      <PageHeader
        title="Add Menu Item"
        breadcrumb={[
          { label: 'Home', to: '/' },
          { label: 'E-commerce' },
          { label: 'Menus', to: '/ecommerce/menu-list' },
          { label: 'Add' },
        ]}
      />

      <div className="row justify-content-center">
        <div className="col-lg-6">
          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmit}>

                <div className="mb-3">
                  <label className="form-label">Level <span className="text-danger">*</span></label>
                  <select className="form-select" value={level} onChange={handleLevelChange}>
                    <option value={1}>Root (top-level)</option>
                    <option value={2}>Sub (child of Root)</option>
                    <option value={3}>Child (child of Sub)</option>
                  </select>
                </div>

                {level === 2 && (
                  <div className="mb-3">
                    <label className="form-label">Parent Root <span className="text-danger">*</span></label>
                    <select className="form-select" value={form.parent_id} onChange={set('parent_id')}>
                      <option value="">— Select root menu —</option>
                      {rootOptions.map((o) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {level === 3 && (
                  <div className="mb-3">
                    <label className="form-label">Parent Sub <span className="text-danger">*</span></label>
                    <select className="form-select" value={form.parent_id} onChange={set('parent_id')}>
                      <option value="">— Select sub menu —</option>
                      {subOptions.map((o) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={`e.g. ${level === 1 ? 'Bed Linen' : level === 2 ? 'Cotton Sheets' : 'King Size'}`}
                    value={form.name}
                    onChange={handleNameChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Slug
                    <span className="text-muted ms-2 fw-normal" style={{ fontSize: '0.8rem' }}>
                      {slugTouched ? 'Custom' : 'Auto-generated'}
                    </span>
                  </label>
                  <input
                    type="text"
                    className="form-control font-monospace"
                    placeholder="bed-linen"
                    value={form.slug}
                    onChange={handleSlugChange}
                  />
                  <div className="form-text">Must be globally unique across all menu levels.</div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Sort Order</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="1"
                    min={1}
                    value={form.serial}
                    onChange={set('serial')}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: Number(e.target.value) }))}
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>

                <div className="d-flex gap-2 justify-content-end">
                  <Link to="/ecommerce/menu-list" className="btn btn-outline-secondary">Cancel</Link>
                  <button type="submit" className="btn btn-primary" disabled={isSaving}>
                    {isSaving && <span className="spinner-border spinner-border-sm me-1" />}
                    Save Menu
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
