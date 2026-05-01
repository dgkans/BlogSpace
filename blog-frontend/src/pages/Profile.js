import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchProfile();
  }, [user, navigate, token]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/users/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      setProfile(data.user);
    } catch (err) {
      setError('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    try {
      const response = await fetch(`http://localhost:5001/api/users/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to delete profile');
      logout();
      navigate('/');
    } catch (err) {
      setError('Error deleting profile');
    }
  };

  if (loading) {
    return (
      <div className="page-content profile-loading">
        <div className="loading-spinner" />
        <p>Loading profile…</p>
      </div>
    );
  }

  if (error) {
    return <div className="page-content"><div className="error-message">{error}</div></div>;
  }

  if (!profile) {
    return <div className="page-content"><div className="error-message">Profile not found</div></div>;
  }

  const initials = profile.fullName
    ? profile.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const joinDate = new Date(profile.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <main className="page-content">
      <div className="profile-page">

        {/* Left panel — avatar + quick actions */}
        <aside className="profile-sidebar">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">{initials}</div>
          </div>
          <h2 className="profile-name">{profile.fullName}</h2>
          <p className="profile-username">@{profile.username}</p>
          <p className="profile-joined">Member since {joinDate}</p>

          <div className="profile-sidebar-actions">
            <Link to="/edit-profile" className="btn-primary profile-btn">Edit Profile</Link>
            <button className="btn-danger profile-btn" onClick={handleDelete}>Delete Account</button>
          </div>
        </aside>

        {/* Right panel — info fields */}
        <div className="profile-main">
          <h1 className="profile-main-title">My Profile</h1>

          <div className="profile-fields">
            <div className="profile-field">
              <div className="profile-field-label">
                <span className="profile-field-icon">👤</span> Full Name
              </div>
              <div className="profile-field-value">{profile.fullName}</div>
            </div>

            <div className="profile-field">
              <div className="profile-field-label">
                <span className="profile-field-icon">📧</span> Email Address
              </div>
              <div className="profile-field-value">{profile.email}</div>
            </div>

            <div className="profile-field">
              <div className="profile-field-label">
                <span className="profile-field-icon">🔖</span> Username
              </div>
              <div className="profile-field-value">@{profile.username}</div>
            </div>

            <div className="profile-field">
              <div className="profile-field-label">
                <span className="profile-field-icon">📅</span> Member Since
              </div>
              <div className="profile-field-value">{joinDate}</div>
            </div>
          </div>

          <div className="profile-quick-links">
            <Link to="/blogs" className="profile-quick-link">
              <span className="pql-icon">✍️</span>
              <span className="pql-label">My Blogs</span>
              <span className="pql-arrow">→</span>
            </Link>
            <Link to="/blogs/new" className="profile-quick-link">
              <span className="pql-icon">✨</span>
              <span className="pql-label">Write New Post</span>
              <span className="pql-arrow">→</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Profile;
