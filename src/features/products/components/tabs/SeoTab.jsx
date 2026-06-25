import { TextField, TextareaField } from '../../../../shared/components/FormField';

const MAX_TITLE = 60;
const MAX_DESC = 160;

/**
 * SeoTab — meta title, description, og_image URL.
 *
 * Props:
 *   data     { meta_title, meta_description, og_image }
 *   onChange (patch) => void
 *   errors   object
 */
export default function SeoTab({ data, onChange, errors = {} }) {
  const set = (field) => (e) => onChange({ [field]: e.target.value });

  const titleLen = (data.meta_title ?? '').length;
  const descLen = (data.meta_description ?? '').length;

  return (
    <div className="row g-3">
      <div className="col-12">
        <label className="form-label fw-semibold">
          Meta Title{' '}
          <span className={titleLen > MAX_TITLE ? 'text-danger' : 'text-muted'}>
            ({titleLen}/{MAX_TITLE})
          </span>
        </label>
        <input
          className={`form-control${errors.meta_title ? ' is-invalid' : ''}`}
          name="meta_title"
          value={data.meta_title ?? ''}
          onChange={set('meta_title')}
          maxLength={70}
        />
        {errors.meta_title && (
          <div className="invalid-feedback">{errors.meta_title[0]}</div>
        )}
        <div className="form-text">Ideal length ≤ {MAX_TITLE} characters.</div>
      </div>

      <div className="col-12">
        <label className="form-label fw-semibold">
          Meta Description{' '}
          <span className={descLen > MAX_DESC ? 'text-danger' : 'text-muted'}>
            ({descLen}/{MAX_DESC})
          </span>
        </label>
        <textarea
          className={`form-control${errors.meta_description ? ' is-invalid' : ''}`}
          name="meta_description"
          rows={3}
          value={data.meta_description ?? ''}
          onChange={set('meta_description')}
          maxLength={200}
        />
        {errors.meta_description && (
          <div className="invalid-feedback">{errors.meta_description[0]}</div>
        )}
        <div className="form-text">Ideal length ≤ {MAX_DESC} characters.</div>
      </div>

      <div className="col-12">
        <TextField
          label="OG Image URL"
          name="og_image"
          value={data.og_image ?? ''}
          onChange={set('og_image')}
          error={errors.og_image}
          hint="Open Graph image shown when the product is shared on social media."
        />
      </div>

      {/* SERP preview */}
      {(data.meta_title || data.meta_description) && (
        <div className="col-12">
          <label className="form-label fw-semibold">SERP Preview</label>
          <div className="border rounded p-3 bg-white">
            <div style={{ color: '#1a0dab', fontSize: '18px', cursor: 'pointer' }}>
              {data.meta_title || '(no title)'}
            </div>
            <div style={{ color: '#006621', fontSize: '13px' }}>
              https://hometex.com.bd/products/...
            </div>
            <div style={{ color: '#545454', fontSize: '13px' }}>
              {data.meta_description || '(no description)'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
