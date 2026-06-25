import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { TextField, SelectField } from '../../../../shared/components/FormField';

const VISIBILITY_OPTIONS = [
  { value: 'visible', label: 'Visible' },
  { value: 'catalog', label: 'Catalog only' },
  { value: 'search', label: 'Search only' },
  { value: 'hidden', label: 'Hidden' },
];

const TYPE_OPTIONS = [
  { value: 'simple', label: 'Simple' },
  { value: 'variable', label: 'Variable' },
  { value: 'grouped', label: 'Grouped' },
  { value: 'bundle', label: 'Bundle' },
];

const STATUS_OPTIONS = [
  { value: 1, label: 'Active' },
  { value: 0, label: 'Inactive' },
];

const BADGE_FIELDS = [
  { key: 'isFeatured', label: 'Featured' },
  { key: 'isNew', label: 'New' },
  { key: 'isTrending', label: 'Trending' },
  { key: 'is_bestseller', label: 'Bestseller' },
  { key: 'is_limited_edition', label: 'Limited Edition' },
  { key: 'is_exclusive', label: 'Exclusive' },
  { key: 'is_eco_friendly', label: 'Eco Friendly' },
];

/**
 * BasicInfoTab
 * Props:
 *   data        object   formData slice for this tab
 *   onChange    (patch: object) => void   merges patch into parent formData
 *   formMeta    object   { categories, subCategories, childSubCategories, brands, countries, suppliers }
 *   errors      object
 */
export default function BasicInfoTab({ data, onChange, formMeta = {}, errors = {} }) {
  const { categories = [], brands = [], countries = [], suppliers = [],
          subCategories = [], childSubCategories = [] } = formMeta;

  const set = (field) => (e) => onChange({ [field]: e.target.value });
  const setVal = (field, value) => onChange({ [field]: value });

  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    onChange({ name, slug });
  };

  const handleCategoryChange = (e) => {
    onChange({ category_id: e.target.value, sub_category_id: '', child_sub_category_id: '' });
  };

  const handleSubCategoryChange = (e) => {
    onChange({ sub_category_id: e.target.value, child_sub_category_id: '' });
  };

  const filteredSubs = subCategories.filter(
    (s) => !data.category_id || String(s.category_id) === String(data.category_id)
  );
  const filteredChildren = childSubCategories.filter(
    (c) => !data.sub_category_id || String(c.sub_category_id) === String(data.sub_category_id)
  );

  return (
    <div className="row">
      {/* Name + slug */}
      <div className="col-md-6">
        <TextField label="Product Name" name="name" value={data.name} onChange={handleNameChange}
          error={errors.name} required />
      </div>
      <div className="col-md-6">
        <TextField label="Slug" name="slug" value={data.slug} onChange={set('slug')}
          error={errors.slug} hint="Auto-generated from name. Edit if needed." />
      </div>

      {/* SKU */}
      <div className="col-md-4">
        <TextField label="SKU" name="sku" value={data.sku} onChange={set('sku')}
          error={errors.sku} />
      </div>

      {/* Status + Visibility + Type */}
      <div className="col-md-2">
        <SelectField label="Status" name="status" value={data.status} onChange={set('status')}
          options={STATUS_OPTIONS} error={errors.status} />
      </div>
      <div className="col-md-3">
        <SelectField label="Visibility" name="visibility" value={data.visibility}
          onChange={set('visibility')} options={VISIBILITY_OPTIONS} error={errors.visibility} />
      </div>
      <div className="col-md-3">
        <SelectField label="Type" name="type" value={data.type}
          onChange={set('type')} options={TYPE_OPTIONS} error={errors.type} />
      </div>

      {/* Category cascade */}
      <div className="col-md-4">
        <SelectField label="Category" name="category_id" value={data.category_id}
          onChange={handleCategoryChange}
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          error={errors.category_id} required />
      </div>
      <div className="col-md-4">
        <SelectField label="Sub-category" name="sub_category_id" value={data.sub_category_id}
          onChange={handleSubCategoryChange}
          options={filteredSubs.map((s) => ({ value: s.id, label: s.name }))}
          error={errors.sub_category_id} />
      </div>
      <div className="col-md-4">
        <SelectField label="Child sub-category" name="child_sub_category_id"
          value={data.child_sub_category_id} onChange={set('child_sub_category_id')}
          options={filteredChildren.map((c) => ({ value: c.id, label: c.name }))}
          error={errors.child_sub_category_id} />
      </div>

      {/* Brand + Country + Supplier */}
      <div className="col-md-4">
        <SelectField label="Brand" name="brand_id" value={data.brand_id} onChange={set('brand_id')}
          options={brands.map((b) => ({ value: b.id, label: b.name }))} error={errors.brand_id} />
      </div>
      <div className="col-md-4">
        <SelectField label="Country of Origin" name="country_id" value={data.country_id}
          onChange={set('country_id')}
          options={countries.map((c) => ({ value: c.id, label: c.name }))}
          error={errors.country_id} />
      </div>
      <div className="col-md-4">
        <SelectField label="Supplier" name="supplier_id" value={data.supplier_id}
          onChange={set('supplier_id')}
          options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
          error={errors.supplier_id} />
      </div>

      {/* Short description */}
      <div className="col-12">
        <TextField label="Short Description" name="short_description"
          value={data.short_description} onChange={set('short_description')}
          error={errors.short_description} />
      </div>

      {/* Rich description */}
      <div className="col-12 mb-3">
        <label className="form-label fw-semibold">Description</label>
        <ReactQuill
          value={data.description ?? ''}
          onChange={(val) => setVal('description', val)}
          theme="snow"
        />
        {errors.description && (
          <div className="invalid-feedback d-block">{errors.description[0]}</div>
        )}
      </div>

      {/* Badges */}
      <div className="col-12">
        <label className="form-label fw-semibold">Product Badges</label>
        <div className="d-flex flex-wrap gap-3">
          {BADGE_FIELDS.map(({ key, label }) => (
            <div key={key} className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id={key}
                checked={Boolean(data[key])}
                onChange={(e) => setVal(key, e.target.checked ? 1 : 0)}
              />
              <label className="form-check-label" htmlFor={key}>{label}</label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
