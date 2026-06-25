import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../shared/hooks/useAuth';
import { clearSession } from '../shared/utils/session';

const ROLE_LABELS = {
  admin:           'Administrator',
  manager:         'Manager',
  product_manager: 'Product Manager',
  sales_staff:     'Sales Staff',
  warehouse:       'Warehouse',
};

export default function Nav({ onToggle }) {
  const { user, photoUrl, isAdmin, roles } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  const handleLogout = () => {
    clearSession();
    queryClient.clear();
    navigate('/login', { replace: true });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const roleLabel = roles.map((r) => ROLE_LABELS[r] ?? r).join(', ') || 'Staff';

  return (
    <header className="app-topbar">
      <button className="topbar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
        <span className="hamburger-icon" aria-hidden="true">
          <span /><span /><span />
        </span>
      </button>

      <div className="topbar-divider" />

      <div className="topbar-spacer" />

      {/* User dropdown */}
      <div className="position-relative" ref={dropRef}>
        <button
          className="topbar-user"
          onClick={() => setDropOpen((v) => !v)}
          aria-expanded={dropOpen}
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="avatar"
              className="user-avatar-sm"
              style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <span className="user-avatar-sm">{initials}</span>
          )}
          <span className="user-name-sm d-none d-sm-inline">{user?.name ?? 'Account'}</span>
          <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.6rem', opacity: 0.6 }} />
        </button>

        {dropOpen && (
          <div
            className="position-absolute end-0 mt-1 bg-white border rounded shadow-sm"
            style={{ minWidth: 200, top: '100%', zIndex: 1050 }}
          >
            <div className="px-3 py-2 border-bottom">
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                {user?.email ?? roleLabel}
              </div>
            </div>
            <div className="py-1">
              <Link
                to="/profile"
                className="dropdown-item d-flex align-items-center gap-2"
                style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                onClick={() => setDropOpen(false)}
              >
                <i className="fa-solid fa-user" style={{ width: 14, opacity: 0.6 }} />
                My Profile
              </Link>
              {user?.id && (
                <Link
                  to={`/activity-logs/${user.id}`}
                  className="dropdown-item d-flex align-items-center gap-2"
                  style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                  onClick={() => setDropOpen(false)}
                >
                  <i className="fa-solid fa-clock-rotate-left" style={{ width: 14, opacity: 0.6 }} />
                  My Activity
                </Link>
              )}
              <div className="dropdown-divider my-1" />
              <button
                className="dropdown-item d-flex align-items-center gap-2"
                style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                onClick={handleLogout}
              >
                <i className="fa-solid fa-right-from-bracket" style={{ width: 14, opacity: 0.6 }} />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
