import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import api from '../../../api/axiosInstance';
import { setToken } from '../../../shared/utils/session';
import logo from '../../../assets/img/hometex-logo.png';

export default function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [input, setInput] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleInput = (e) =>
    setInput((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleLogin = async () => {
    setErrors({});
    setIsLoading(true);
    try {
      const { data } = await api.post('/login', input);
      setToken(data.token);
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      navigate('/', { replace: true });
    } catch (error) {
      const status = error?.response?.status;
      if (status === 422) {
        setErrors(error?.response?.data?.errors ?? {});
      } else if (status === 401) {
        setErrors({ general: ['Invalid email/phone or password.'] });
      } else {
        setErrors({ general: ['Unable to reach the server. Please try again.'] });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="login-shell">
      {/* Left brand panel */}
      <div className="login-brand-panel">
        <img src={logo} alt="Hometex" className="brand-logo" />
        <h1 className="brand-title">Hometex Bangladesh</h1>
        <div className="brand-divider" />
        <p className="brand-sub">Multi-branch inventory &amp; point of sale system</p>
        <ul className="brand-features">
          <li><i className="fa-solid fa-circle-check" /> Real-time stock tracking</li>
          <li><i className="fa-solid fa-circle-check" /> Multi-branch management</li>
          <li><i className="fa-solid fa-circle-check" /> Online &amp; store order processing</li>
          <li><i className="fa-solid fa-circle-check" /> Sales reporting &amp; analytics</li>
        </ul>
      </div>

      {/* Right form panel */}
      <div className="login-form-panel">
        <div className="login-box">
          <h2 className="login-heading">Sign in</h2>
          <p className="login-sub">Enter your credentials to access the admin panel.</p>

          {errors.general && (
            <div className="general-error">{errors.general[0]}</div>
          )}

          <div className="mb-3">
            <label className="form-label" htmlFor="email">Email or Phone</label>
            <input
              id="email"
              className={`form-control${errors.email ? ' is-invalid' : ''}`}
              type="text"
              name="email"
              value={input.email}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              autoComplete="username"
              placeholder="admin@hometex.com"
              autoFocus
            />
            {errors.email && <div className="field-error">{errors.email[0]}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-group">
              <input
                id="password"
                className={`form-control${errors.password ? ' is-invalid' : ''}`}
                type={showPw ? 'text' : 'password'}
                name="password"
                value={input.password}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                autoComplete="current-password"
                placeholder="••••••••"
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                style={{ borderColor: '#d1d5db' }}
                onClick={() => setShowPw((v) => !v)}
                tabIndex={-1}
              >
                <i className={`fa-solid ${showPw ? 'fa-eye-slash' : 'fa-eye'}`} />
              </button>
            </div>
            {errors.password && <div className="field-error">{errors.password[0]}</div>}
          </div>

          <button
            className="btn btn-login"
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
