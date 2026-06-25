import { useState, useRef, useEffect } from 'react';

const COUNTRIES = [
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh', digits: 10 },
  { code: '+91',  flag: '🇮🇳', name: 'India',       digits: 10 },
  { code: '+92',  flag: '🇵🇰', name: 'Pakistan',    digits: 10 },
  { code: '+94',  flag: '🇱🇰', name: 'Sri Lanka',   digits: 9  },
  { code: '+977', flag: '🇳🇵', name: 'Nepal',       digits: 10 },
  { code: '+1',   flag: '🇺🇸', name: 'USA / Canada', digits: 10 },
  { code: '+44',  flag: '🇬🇧', name: 'UK',          digits: 10 },
  { code: '+971', flag: '🇦🇪', name: 'UAE',         digits: 9  },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia', digits: 9 },
  { code: '+974', flag: '🇶🇦', name: 'Qatar',       digits: 8  },
  { code: '+965', flag: '🇰🇼', name: 'Kuwait',      digits: 8  },
  { code: '+60',  flag: '🇲🇾', name: 'Malaysia',    digits: 9  },
  { code: '+65',  flag: '🇸🇬', name: 'Singapore',   digits: 8  },
];

export default function PhoneInput({ countryCode, phone, onCountryChange, onPhoneChange, error, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0];

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className={`input-group${error ? ' is-invalid' : ''}`} style={{ position: 'relative' }}>
      <button
        type="button"
        className="btn btn-outline-secondary d-flex align-items-center gap-1"
        style={{ fontSize: '0.82rem', padding: '0 10px', whiteSpace: 'nowrap', minWidth: 80 }}
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
      >
        <span>{selected.flag}</span>
        <span>{selected.code}</span>
        <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.6rem', opacity: 0.6 }} />
      </button>

      <input
        type="tel"
        className={`form-control${error ? ' is-invalid' : ''}`}
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, '').slice(0, 15))}
        placeholder={`Phone number`}
        disabled={disabled}
      />

      {open && (
        <div
          style={{
            position: 'absolute', top: '100%', left: 0, zIndex: 1050,
            background: '#fff', border: '1px solid #dee2e6', borderRadius: 6,
            boxShadow: '0 4px 16px rgba(0,0,0,.12)', minWidth: 240, maxHeight: 280,
            overflowY: 'auto',
          }}
        >
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              type="button"
              className="d-flex align-items-center gap-2 w-100 text-start px-3 py-2"
              style={{
                border: 'none', background: c.code === countryCode ? '#eff6ff' : 'transparent',
                fontSize: '0.82rem', cursor: 'pointer',
              }}
              onClick={() => { onCountryChange(c.code); setOpen(false); }}
            >
              <span style={{ fontSize: '1.1rem' }}>{c.flag}</span>
              <span style={{ color: '#374151' }}>{c.name}</span>
              <span style={{ color: '#6b7280', marginLeft: 'auto' }}>{c.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
