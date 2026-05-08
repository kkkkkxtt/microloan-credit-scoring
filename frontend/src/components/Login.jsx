import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

const Login = ({ switchToRegister }) => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    if (!result.success) {
      // --- SAFE ERROR PARSER ---
      let errMsg = 'An unexpected error occurred.';
      if (typeof result.error === 'string') {
        errMsg = result.error;
      } else if (result.error?.detail) {
        if (Array.isArray(result.error.detail)) {
          errMsg = result.error.detail[0].msg; // Catches FastAPI 422 arrays
        } else {
          errMsg = result.error.detail;
        }
      }
      setError(errMsg);
    }
    setLoading(false);
  };

  return (
    <div
      className="custom-card p-4 p-md-5 mx-auto slide-down"
      style={{ maxWidth: '450px', marginTop: '5vh' }}
    >
      <div className="text-center mb-4">
        <div
          style={{
            width: 48,
            height: 48,
            background: 'var(--color-accent-light)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}
        >
          <ShieldCheck size={24} color="var(--color-accent)" />
        </div>
        <h3 className="fw-bold" style={{ fontFamily: 'Fraunces, serif' }}>
          Welcome Back
        </h3>
        <p className="text-muted-custom small">
          Enter your credentials to access your account.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 small rounded-3 mb-4">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3 text-start">
          <label className="text-muted-custom small fw-semibold d-block mb-2">
            Email Address
          </label>
          <input
            type="email"
            className="custom-input w-100 d-block"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-4 text-start">
          <label className="text-muted-custom small fw-semibold d-block mb-2">
            Password
          </label>
          <input
            type="password"
            className="custom-input w-100 d-block"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-cta w-100 mb-3 mt-2"
          disabled={loading}
        >
          {loading ? 'Authenticating...' : 'Secure Login'}
        </button>
      </form>

      <div className="text-center mt-4 pt-3 border-top">
        <span className="text-muted-custom small">Don't have an account? </span>
        <button
          onClick={switchToRegister}
          className="btn btn-link p-0 fw-bold small text-decoration-none"
          style={{ color: 'var(--color-accent)' }}
        >
          Create one now
        </button>
      </div>
    </div>
  );
};

export default Login;
