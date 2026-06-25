import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import PageHeader from '../../../shared/components/PageHeader';

const slugify = (str) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

const EMPTY = {
  name:        '',
  slug:        '',
  serial:      '',
  status:      '1',
  description: '',
  photo:       '',
};

/**
 * CatalogForm — shared create/edit form for Brand / Category / SubCategory / ChildSubCategory.
 *
 * config shape:
 *   title           string       'Add Brand' | 'Edit Brand'
 *   entityLabel     string       'Brand'
 *   backPath        string       '/brand'
 *   breadcrumb      array
 *   photoField      string       'logo' | 'photo'   — the JSON key sent to backend
 *   photoPreviewField string     'logo_preview' | 'photo_preview'
 *   photoLabel      string       'Logo' | 'Photo'
 *   parentField     null | {
 *                     label:       string,    'Category'
 *                     key:         string,    'category_id'
 *                     useOptions:  hook,      useCategoryOptions
 *                   }
 *   id              string|undefined   undefined = create
 *   useItem         hook               for prefill in edit mode
 *   useCreate       hook
 *   useUpdate       hook
 */
export default function CatalogForm({ config }) {
  const {
    title,
    entityLabel,
    backPath,
    breadcrumb,
    photoField      = 'photo',
    photoPreviewField = 'photo_preview',
    photoLabel      = 'Photo',
    parentField     = null,
    id,
    useItem,
    useCreate,
    useUpdate,
  } = config;

  const navigate      = useNavigate();
  const fileRef       = useRef(null);
  const isEdit        = Boolean(id);

  const [form, setForm]               = useState(EMPTY);
  const [previewUrl, setPreviewUrl]   = useState(null);
  const [slugEdited, setSlugEdited]   = useState(false);

  // Options for parent dropdown
  const parentOptions = parentField?.useOptions?.() ?? { data: [], isLoading: false };

  // Prefill in edit mode
  const { data: item, isLoading: itemLoading } = (useItem && isEdit)
    ? useItem(id)
    : { data: null, isLoading: false };

  useEffect(() => {
    if (item) {
      setForm({
        name:                    item.name        ?? '',
        slug:                    item.slug        ?? '',
        serial:                  item.serial      ?? '',
        status:                  String(item.status ?? '1'),
        description:             item.description ?? '',
        photo:                   '',            // never prefill base64 from server
        ...(parentField ? { [parentField.key]: String(item[parentField.key] ?? '') } : {}),
      });
      setSlugEdited(true);
      const existing = item[photoPreviewField];
      if (existing) setPreviewUrl(existing);
    }
  }, [item]); // eslint-disable-line react-hooks/exhaustive-deps

  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Handlers
  const handleNameChange = (e) => {
    const name = e.target.value;
    setForm((f) => ({
      ...f,
      name,
      ...(!slugEdited ? { slug: slugify(name) } : {}),
    }));
  };

  const handleSlugChange = (e) => {
    setSlugEdited(true);
    setForm((f) => ({ ...f, slug: e.target.value }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setPreviewUrl(base64);
      setForm((f) => ({ ...f, [photoField]: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPreviewUrl(null);
    setForm((f) => ({ ...f, [photoField]: '' }));
    if (fileRef.current) fileRef.current.value = '';
  };

  const buildPayload = () => {
    const payload = {
      name:        form.name,
      slug:        form.slug,
      serial:      form.serial,
      status:      form.status,
      description: form.description,
    };
    if (form[photoField]) payload[photoField] = form[photoField];
    if (parentField)      payload[parentField.key] = form[parentField.key];
    return payload;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      Swal.fire({ icon: 'warning', title: 'Name is required', timer: 1500, showConfirmButton: false });
      return;
    }
    if (parentField && !form[parentField.key]) {
      Swal.fire({ icon: 'warning', title: `${parentField.label} is required`, timer: 1500, showConfirmButton: false });
      return;
    }

    const payload = buildPayload();
    const mutation = isEdit ? updateMutation : createMutation;
    const mutArg   = isEdit ? { id, ...payload } : payload;

    mutation.mutate(mutArg, {
      onSuccess: () => {
        Swal.fire({
          icon: 'success',
          title: isEdit ? `${entityLabel} updated` : `${entityLabel} created`,
          timer: 1500,
          showConfirmButton: false,
        });
        navigate(backPath);
      },
      onError: (err) => {
        const msg = err?.response?.data?.message ?? 'Something went wrong.';
        Swal.fire({ icon: 'error', title: 'Error', text: msg });
      },
    });
  };

  if (isEdit && itemLoading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <span className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={title}
        breadcrumb={breadcrumb}
        actionLabel="Back"
        actionTo={backPath}
        actionIcon="fa-arrow-left"
      />

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} noValidate>
            <div className="row g-3">

              {/* Parent selector — only for SubCategory / ChildSubCategory */}
              {parentField && (
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">
                    {parentField.label} <span className="text-danger">*</span>
                  </label>
                  <select
                    name={parentField.key}
                    className="form-select"
                    value={form[parentField.key] ?? ''}
                    onChange={handleChange}
                    disabled={parentOptions.isLoading}
                  >
                    <option value="">— Select {parentField.label} —</option>
                    {(parentOptions.data ?? []).map((opt) => (
                      <option key={opt.id} value={String(opt.id)}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Name */}
              <div className={`col-12 ${parentField ? 'col-md-6' : 'col-md-6'}`}>
                <label className="form-label fw-semibold">
                  Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={form.name}
                  onChange={handleNameChange}
                  placeholder={`Enter ${entityLabel.toLowerCase()} name`}
                />
              </div>

              {/* Slug */}
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Slug</label>
                <input
                  type="text"
                  className="form-control"
                  name="slug"
                  value={form.slug}
                  onChange={handleSlugChange}
                  placeholder="auto-generated from name"
                />
                <div className="form-text">Auto-generated. Edit manually if needed.</div>
              </div>

              {/* Serial */}
              <div className="col-6 col-md-3">
                <label className="form-label fw-semibold">Sort Order</label>
                <input
                  type="number"
                  className="form-control"
                  name="serial"
                  value={form.serial}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                />
              </div>

              {/* Status */}
              <div className="col-6 col-md-3">
                <label className="form-label fw-semibold">Status</label>
                <select
                  name="status"
                  className="form-select"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>

              {/* Description */}
              <div className="col-12">
                <label className="form-label fw-semibold">Description</label>
                <textarea
                  className="form-control"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>

              {/* Photo upload */}
              <div className="col-12">
                <label className="form-label fw-semibold">{photoLabel}</label>
                <div className="d-flex align-items-start gap-3 flex-wrap">
                  <div>
                    <input
                      ref={fileRef}
                      type="file"
                      className="form-control"
                      accept="image/*"
                      style={{ maxWidth: 320 }}
                      onChange={handleFileChange}
                    />
                    <div className="form-text">JPG, PNG, WEBP — max 2 MB recommended</div>
                  </div>

                  {previewUrl && (
                    <div className="position-relative">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        style={{
                          width: 80,
                          height: 80,
                          objectFit: 'cover',
                          borderRadius: 6,
                          border: '1px solid #dee2e6',
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-danger position-absolute top-0 end-0"
                        style={{ padding: '1px 5px', fontSize: 10, transform: 'translate(40%, -40%)' }}
                        onClick={handleRemovePhoto}
                        title="Remove photo"
                      >
                        <i className="fa-solid fa-xmark" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="col-12 pt-2">
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                  {isPending && (
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                  )}
                  {isEdit ? 'Update' : 'Save'} {entityLabel}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary ms-2"
                  onClick={() => navigate(backPath)}
                  disabled={isPending}
                >
                  Cancel
                </button>
              </div>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
