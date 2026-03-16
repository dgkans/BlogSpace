import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Replace with your actual API endpoint
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        navigate('/');
      } else {
        const data = await response.json();
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-content">
      <section className="auth-section">
        <div className="auth-container">
          <h1>Create Account</h1>
          <p className="auth-subtitle">Join our blogging community</p>

          {error && <div className="error-message">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="John Doe"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Sign in here</Link></p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Register;
