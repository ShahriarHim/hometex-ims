import ReactSelect from 'react-select';

/**
 * FormField — unified input wrapper for all form fields.
 * Handles error display consistently across all features.
 *
 * ─── VARIANTS ───────────────────────────────────────────────────────────────
 *
 * <FormField label="Name" error={errors.name}>
 *   <input className="form-control" ... />
 * </FormField>
 *
 * or use the named exports below for common cases:
 *
 * <TextField   name="name"  label="Name"  value={v} onChange={fn} error={errors.name} />
 * <SelectField name="role"  label="Role"  value={v} onChange={fn} error={errors.role} options={[{value,label}]} />
 * <ReactSelectField name="tags" label="Tags" value={v} onChange={fn} error={errors.tags} options={[...]} isMulti />
 * <TextareaField name="desc" label="Description" value={v} onChange={fn} error={errors.desc} rows={4} />
 * <FileField name="photo" label="Photo" onChange={fn} error={errors.photo} accept="image/*" preview={url} />
 *
 * ─── PROPS (FormField wrapper) ───────────────────────────────────────────────
 *   label     string
 *   error     string | string[]  — first element shown if array
 *   required  boolean
 *   hint      string             — small helper text below input
 *   className string             — applied to the outer div
 *   children  ReactNode
 */
export default function FormField({ label, error, required, hint, className = 'mb-3', children }) {
  const errorMsg = Array.isArray(error) ? error[0] : error;
  return (
    <div className={className}>
      {label && (
        <label className="form-label fw-semibold">
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </label>
      )}
      {children}
      {hint && !errorMsg && <div className="form-text">{hint}</div>}
      {errorMsg && <div className="invalid-feedback d-block">{errorMsg}</div>}
    </div>
  );
}

// ─── TextField ────────────────────────────────────────────────────────────────

export function TextField({
  name,
  label,
  value,
  onChange,
  error,
  required,
  hint,
  type = 'text',
  placeholder,
  disabled,
  className,
  ...rest
}) {
  const errorMsg = Array.isArray(error) ? error[0] : error;
  return (
    <FormField label={label} error={error} required={required} hint={hint} className={className}>
      <input
        id={name}
        name={name}
        type={type}
        className={`form-control${errorMsg ? ' is-invalid' : ''}`}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        {...rest}
      />
    </FormField>
  );
}

// ─── SelectField (native <select>) ───────────────────────────────────────────

export function SelectField({
  name,
  label,
  value,
  onChange,
  error,
  required,
  hint,
  options = [],
  placeholder = 'Select…',
  disabled,
  className,
}) {
  const errorMsg = Array.isArray(error) ? error[0] : error;
  return (
    <FormField label={label} error={error} required={required} hint={hint} className={className}>
      <select
        id={name}
        name={name}
        className={`form-select${errorMsg ? ' is-invalid' : ''}`}
        value={value ?? ''}
        onChange={onChange}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}

// ─── ReactSelectField (react-select, supports multi + async) ─────────────────

export function ReactSelectField({
  name,
  label,
  value,
  onChange,
  error,
  required,
  hint,
  options = [],
  isMulti = false,
  isLoading = false,
  isClearable = true,
  placeholder = 'Select…',
  disabled,
  className,
}) {
  const errorMsg = Array.isArray(error) ? error[0] : error;
  return (
    <FormField label={label} error={error} required={required} hint={hint} className={className}>
      <ReactSelect
        inputId={name}
        name={name}
        options={options}
        value={value}
        onChange={onChange}
        isMulti={isMulti}
        isLoading={isLoading}
        isClearable={isClearable}
        isDisabled={disabled}
        placeholder={placeholder}
        classNamePrefix="rs"
        styles={{
          control: (base) => ({
            ...base,
            borderColor: errorMsg ? '#dc3545' : base.borderColor,
            '&:hover': { borderColor: errorMsg ? '#dc3545' : base['&:hover']?.borderColor },
          }),
        }}
      />
      {errorMsg && <div className="invalid-feedback d-block">{errorMsg}</div>}
    </FormField>
  );
}

// ─── TextareaField ────────────────────────────────────────────────────────────

export function TextareaField({
  name,
  label,
  value,
  onChange,
  error,
  required,
  hint,
  rows = 3,
  placeholder,
  disabled,
  className,
}) {
  const errorMsg = Array.isArray(error) ? error[0] : error;
  return (
    <FormField label={label} error={error} required={required} hint={hint} className={className}>
      <textarea
        id={name}
        name={name}
        className={`form-control${errorMsg ? ' is-invalid' : ''}`}
        value={value ?? ''}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
      />
    </FormField>
  );
}

// ─── FileField ────────────────────────────────────────────────────────────────

export function FileField({
  name,
  label,
  onChange,
  error,
  required,
  hint,
  accept = 'image/*',
  preview,
  disabled,
  className,
}) {
  const errorMsg = Array.isArray(error) ? error[0] : error;
  return (
    <FormField label={label} error={error} required={required} hint={hint} className={className}>
      {preview && (
        <div className="mb-2">
          <img
            src={preview}
            alt="preview"
            style={{ maxHeight: 80, maxWidth: 120, objectFit: 'cover', borderRadius: 4 }}
          />
        </div>
      )}
      <input
        id={name}
        name={name}
        type="file"
        className={`form-control${errorMsg ? ' is-invalid' : ''}`}
        onChange={onChange}
        accept={accept}
        disabled={disabled}
      />
    </FormField>
  );
}
