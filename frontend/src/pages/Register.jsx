import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await api.post('/auth/register', formData);
      navigate('/login');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="auth-shell">
      <aside className="auth-showcase">
        <p className="brand-tag">AI Student Productivity OS</p>
        <h1>Build Your Smart Study Space</h1>
        <p>
          Create your account to organize subjects, map priorities, and generate AI-powered study
          plans.
        </p>
        <ul>
          <li>Organized daily planning</li>
          <li>Adaptive AI subject allocation</li>
          <li>Focused academic progress</li>
        </ul>
      </aside>

      <main className="auth-panel">
        <div className="auth-container">
          <div className="auth-header">
            <h2>Create Account</h2>
            <p>Get started in less than a minute.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <label htmlFor="register-name">Full Name</label>
            <input
              id="register-name"
              type="text"
              name="name"
              placeholder="Your full name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              name="password"
              placeholder="Create password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            {error && <p className="error-text">{error}</p>}
            <button type="submit">Register</button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default Register;
