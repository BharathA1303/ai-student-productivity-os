import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const response = await api.post('/auth/login', formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="auth-shell">
      <aside className="auth-showcase">
        <p className="brand-tag">AI Student Productivity OS</p>
        <h1>Study Better, Every Day</h1>
        <p>
          Plan priorities, track progress, and generate smart schedules that adapt to your exam
          timeline.
        </p>
        <ul>
          <li>Priority-aware planning</li>
          <li>Exam-date smart distribution</li>
          <li>Clean dashboard workflow</li>
        </ul>
      </aside>

      <main className="auth-panel">
        <div className="auth-container">
          <div className="auth-header">
            <h2>Welcome Back</h2>
            <p>Log in to continue your learning workflow.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              name="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            {error && <p className="error-text">{error}</p>}
            <button type="submit">Login</button>
          </form>

          <p className="auth-footer">
            Don&apos;t have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default Login;
