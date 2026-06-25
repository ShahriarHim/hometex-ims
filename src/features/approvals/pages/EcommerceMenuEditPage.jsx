import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import PageHeader from '../../../shared/components/PageHeader';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import {
  useCategory, useUpdateCategory,
  useSubCategory, useUpdateSubCategory,
  useChildSubCategory, useUpdateChildSubCategory,
  useCategories,
  useSubCategories,
} from '../../catalog/api';

const toast = (icon, title) =>
  Swal.fire({ toast: true, position: 'top-end', icon, title, timer: 1400, showConfirmButton: false });

const slugify = (str) =>
  str.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

const LEVEL_FROM_PATH = { root: 1, sub: 2, child: 3 };

function useMenuRecord(level, id) {
  const cat    = useCategory(level === 1 ? id : null);
  const sub    = useSubCategory(level === 2 ? id : null);
  const child  = useChildSubCategory(level === 3 ? id : null);
  if (level === 1) return cat;
  if (level === 2) return sub;
  return child;
}

function useMenuUpdate(level) {
  const updCat   = useUpdateCategory();
  const updSub   = useUpdateSubCategory();
  const updChild = useUpdateChildSubCategory();
  if (level === 1) return updCat;
  if (level === 2) return updSub;
  return updChild;
}

export default function EcommerceMenuEditPage() {
  const { level: levelSlug, id } = useParams();
  const navigate = useNavigate();

  const level = LEVEL_FROM_PATH[levelSlug] ?? 1;

  const { data: record, isLoading } = useMenuRecord(level, id);
  const updateMutation = useMenuUpdate(level);

  const { data: categoryOptions } = useCategories(
    { per_page: 1000, order_by: 'name', direction: 'asc' },
  );
  const { data: subCategoryOptions } = useSubCategories(
    { per_page: 1000, order_by: 'name', direction: 'asc' },
  );

  const rootOptions = categoryOptions?.data ?? [];
  const subOptions  = subCategoryOptions?.data ?? [];

  const [form, setForm]           = useState(null);
  const [originalSlug, setOriginalSlug] = useState('');
  const [slugWarned, setSlugWarned]     = useState(false);

  useEffect(() => {
    if (!record) return;
    setForm({
      name:      record.name ?? '',
      slug:      record.slug ?? '',
      parent_id: record.parent_id ?? '',
      serial:    record.serial ?? '',
      status:    record.status ?? 1,
    });
    setOriginalSlug(record.slug ?? '');
  }, [record]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleNameChange = (e) => {
    const name = e.target.value;
    setForm((f) => ({ ...f, name }));
  };

  const handleSlugChange = (e) => {
    const newSlug = e.target.value;
    if (!slugWarned && newSlug !== originalSlug) {
      setSlugWarned(true);
    }
    setForm((f) => ({ ...f, slug: newSlug }));
  };

  const buildBody = () => {
    const base = {
      id:     Number(id),
      name:   form.name.trim(),
      slug:   form.slug.trim(),
      serial: form.serial ? Number(form.serial) : undefined,
      status: Number(form.status),
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

    updateMutation.mutate(buildBody(), {
      onSuccess: (res) => {
        toast(res?.status ?? 'success', res?.message ?? 'Updated');
        navigate('/ecommerce/menu-list');
      },
      onError: (err) => {
        const msg = err?.response?.data?.message ?? 'Failed to update menu item.';
        toast('error', msg);
      },
    });
  };

  if (isLoading || !form) return <LoadingSpinner fullPage />;

  const levelLabel = ['Root', 'Sub', 'Child'][level - 1];

  return (
    <div>
      <PageHeader
        title={`Edit ${levelLabel} Menu`}
        breadcrumb={[
          { label: 'Home', to: '/' },
          { label: 'E-commerce' },
          { label: 'Menus', to: '/ecommerce/menu-list' },
          { label: 'Edit' },
        ]}
      />

      <div className="row justify-content-center">
        <div className="col-lg-6">
          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmit}>

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
                      {subOptions.filter((o) => o.id !== Number(id)).map((o) => (
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
                    value={form.name}
                    onChange={handleNameChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Slug</label>
                  <input
                    type="text"
                    className={`form-control font-monospace${slugWarned ? ' is-warning border-warning' : ''}`}
                    value={form.slug}
                    onChange={handleSlugChange}
                  />
                  {slugWarned && (
                    <div className="form-text text-warning">
                      <i className="fa-solid fa-triangle-exclamation me-1" />
                      Changing the slug will break existing e-commerce URLs that use it.
                    </div>
                  )}
                  {!slugWarned && (
                    <div className="form-text">Must be globally unique across all menu levels.</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Sort Order</label>
                  <input
                    type="number"
                    className="form-control"
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
                  <button type="submit" className="btn btn-primary" disabled={updateMutation.isPending}>
                    {updateMutation.isPending && <span className="spinner-border spinner-border-sm me-1" />}
                    Update Menu
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
