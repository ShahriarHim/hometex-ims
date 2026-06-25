import { useState } from 'react';

export default function PasswordInput({ value, onChange, placeholder, required, className = '', error }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="input-group">
        <input
          className={`form-control${error ? ' is-invalid' : ''}${className ? ` ${className}` : ''}`}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete="new-password"
        />
        <button
          type="button"
          className="btn btn-outline-secondary"
          tabIndex={-1}
          onClick={() => setShow((v) => !v)}
          style={{ border: error ? '1px solid #dc3545' : undefined }}
        >
          <i className={`fa-solid fa-eye${show ? '-slash' : ''}`} style={{ fontSize: '0.8rem' }} />
        </button>
        {error && <div className="invalid-feedback">{Array.isArray(error) ? error[0] : error}</div>}
      </div>
    </div>
  );
}
