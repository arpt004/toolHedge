import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../AuthContext';
import { AdminApiError } from '../api';
import './LoginPage.css';

export function LoginPage() {
  const { admin, login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (admin) {
    const from = (location.state as { from?: string } | null)?.from ?? '/admin';
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      const from = (location.state as { from?: string } | null)?.from ?? '/admin';
      navigate(from, { replace: true });
    } catch (reason) {
      if (reason instanceof AdminApiError && reason.code === 'TOO_MANY_ATTEMPTS') {
        setError('Too many attempts. Please wait a few minutes before trying again.');
      } else if (reason instanceof AdminApiError && reason.code === 'ACCOUNT_DISABLED') {
        setError('This admin account has been disabled.');
      } else {
        setError('Invalid email or password.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login-page">
      <form className="admin-login-card" onSubmit={onSubmit}>
        <div className="admin-login-brand">
          <span className="admin-brand-mark">t</span>
          <span>Toolhedge Admin</span>
        </div>
        <h1>Sign in</h1>
        <p>Admin access only. Contact your team lead if you need an account.</p>
        {error && <div className="admin-banner-error" role="alert">{error}</div>}
        <label className="admin-field">
          <span>Email</span>
          <input
            className="admin-input"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={submitting}
          />
        </label>
        <label className="admin-field">
          <span>Password</span>
          <div className="admin-password-field">
            <input
              className="admin-input"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={submitting}
            />
            <button
              type="button"
              className="admin-password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>
        </label>
        <button className="button button-primary admin-login-submit" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
