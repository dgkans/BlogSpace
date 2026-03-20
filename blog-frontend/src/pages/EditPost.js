import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function EditPost() {
  const { blogId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('draft');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`http://localhost:5001/api/blogs/${blogId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to load blog');
        }

        setTitle(data.blog.title || '');
        setContent(data.blog.content || '');
        setStatus(data.blog.status || 'draft');
      } catch (err) {
        setError(err.message || 'Failed to load blog');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [blogId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch(`http://localhost:5001/api/blogs/${blogId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update blog');
      }

      setStatus(data.blog.status);
      setSuccess('Saved');
      setTimeout(() => {
        navigate('/my-posts');
      }, 600);
    } catch (err) {
      setError(err.message || 'Failed to update blog');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async () => {
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:5001/api/blogs/${blogId}/publish`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to publish blog');
      }

      setStatus(data.blog.status);
      setSuccess('Published');
      setTimeout(() => {
        navigate('/');
      }, 700);
    } catch (err) {
      setError(err.message || 'Failed to publish blog');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="page-content">
        <div className="loading">Loading post...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page-content">
        <div className="error-message">{error}</div>
      </main>
    );
  }

  return (
    <main className="page-content">
      <section className="page-section">
        <h1>Edit Post</h1>
        <p className="muted">Status: {status}</p>

        {success && <div className="success-message">{success}</div>}

        <form className="auth-form" onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="edit-title">Title</label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-content">Content</label>
            <textarea
              id="edit-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          <div className="edit-actions">
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save'}
            </button>

            {status === 'draft' && (
              <button type="button" className="btn-submit" disabled={submitting} onClick={handlePublish}>
                {submitting ? 'Publishing...' : 'Publish'}
              </button>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}

export default EditPost;

