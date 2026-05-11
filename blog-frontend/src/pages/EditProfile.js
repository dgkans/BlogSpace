import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function EditProfile() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setFormData({
        fullName: data.user.fullName,
        email: data.user.email,
      });
    } catch (err) {
      setError('Error loading profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchProfile();
  }, [user, navigate, fetchProfile]);

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
    setSuccess('');
    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully');
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="page-content"><div className="loading">Loading...</div></div>;
  }

  return (
    <main className="page-content">
      <div className="auth-section">
        <div className="auth-container">
          <h1>Edit Profile</h1>
          <p className="auth-subtitle">Update your profile information</p>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

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

            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </form>

          <div className="auth-footer">
            <p><a href="/profile">Back to Profile</a></p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default EditProfile;
