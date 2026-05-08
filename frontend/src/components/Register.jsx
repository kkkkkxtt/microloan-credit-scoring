import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { AlertTriangle, UserPlus } from 'lucide-react';

const Register = ({ switchToLogin }) => {
  const { register } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'applicant', // Default role
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(formData);
    if (!result.success) {
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
      style={{ maxWidth: '500px', marginTop: '5vh' }}
    >
      <div className="text-center mb-4">
        <div
          style={{
            width: 48,
            height: 48,
            background: '#f0fdf4',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}
        >
          <UserPlus size={24} color="#16a34a" />
        </div>
        <h3 className="fw-bold" style={{ fontFamily: 'Fraunces, serif' }}>
          Create Account
        </h3>
        <p className="text-muted-custom small">
          Join Credify to apply for or manage microloans.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 small rounded-3 mb-4">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4 d-flex gap-2 p-1 bg-light rounded-3 border">
          <button
            type="button"
            className={`btn flex-fill py-2 fw-semibold text-sm ${formData.role === 'applicant' ? 'btn-white shadow-sm border text-dark' : 'btn-light text-muted'}`}
            onClick={() => setFormData({ ...formData, role: 'applicant' })}
          >
            Applicant
          </button>
          <button
            type="button"
            className={`btn flex-fill py-2 fw-semibold text-sm ${formData.role === 'loan_officer' ? 'btn-white shadow-sm border text-dark' : 'btn-light text-muted'}`}
            onClick={() => setFormData({ ...formData, role: 'loan_officer' })}
          >
            Loan Officer
          </button>
        </div>

        <div className="mb-3 text-start">
          <label className="text-muted-custom small fw-semibold d-block mb-2">
            Full Name
          </label>
          <input
            type="text"
            name="name"
            className="custom-input w-100 d-block"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3 text-start">
          <label className="text-muted-custom small fw-semibold d-block mb-2">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            className="custom-input w-100 d-block"
            placeholder="name@example.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-4 text-start">
          <label className="text-muted-custom small fw-semibold d-block mb-2">
            Password
          </label>
          <input
            type="password"
            name="password"
            className="custom-input w-100 d-block"
            placeholder="Create a strong password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength="6"
          />
        </div>

        <button
          type="submit"
          className="btn btn-cta w-100 mb-3"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Register Securely'}
        </button>
      </form>

      <div className="text-center mt-4 pt-3 border-top">
        <span className="text-muted-custom small">
          Already have an account?{' '}
        </span>
        <button
          onClick={switchToLogin}
          className="btn btn-link p-0 fw-bold small text-decoration-none"
          style={{ color: 'var(--color-accent)' }}
        >
          Log in here
        </button>
      </div>
    </div>
  );
};

export default Register;
