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
    if (!user) {
      navigate('/login');
      return;
    }
    fetchProfile();
  }, [user, navigate, token]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/users/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data.user);
    } catch (err) {
      setError('Error loading profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        const response = await fetch(`http://localhost:5001/api/users/${user.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete profile');
        }

        logout();
        navigate('/');
      } catch (err) {
        setError('Error deleting profile');
        console.error(err);
      }
    }
  };

  if (loading) {
    return <div className="page-content"><div className="loading">Loading profile...</div></div>;
  }

  if (error) {
    return <div className="page-content"><div className="error-message">{error}</div></div>;
  }

  if (!profile) {
    return <div className="page-content"><div className="error-message">Profile not found</div></div>;
  }

  const createdDate = new Date(profile.createdAt).toLocaleDateString();

  return (
    <main className="page-content">
      <div className="profile-container">
        <div className="profile-header">
          <h1>My Profile</h1>
        </div>

        <div className="profile-info">
          <div className="info-item">
            <div className="info-label">Full Name</div>
            <div className="info-value">{profile.fullName}</div>
          </div>

          <div className="info-item">
            <div className="info-label">Email</div>
            <div className="info-value">{profile.email}</div>
          </div>

          <div className="info-item">
            <div className="info-label">Username</div>
            <div className="info-value">@{profile.username}</div>
          </div>

          <div className="info-item">
            <div className="info-label">Member Since</div>
            <div className="info-value">{createdDate}</div>
          </div>
        </div>

        <div className="profile-actions">
          <Link to="/edit-profile" className="btn-primary">Edit Profile</Link>
          <button className="btn-danger" onClick={handleDelete}>Delete Account</button>
        </div>
      </div>
    </main>
  );
}

export default Profile;
