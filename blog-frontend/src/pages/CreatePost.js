import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function CreatePost() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('draft');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdBlog, setCreatedBlog] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    setCreatedBlog(null);

    try {
      const res = await fetch('http://localhost:5001/api/blogs', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content, status }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create blog');
      }

      setSuccess('Post created successfully');
      setCreatedBlog(data.blog);
      setTitle('');
      setContent('');
      setStatus('draft');

      if (data.blog.status === 'published') {
        setTimeout(() => {
          navigate('/');
        }, 700);
      }
    } catch (err) {
      setError(err.message || 'Failed to create blog');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!createdBlog?.id) return;
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`http://localhost:5001/api/blogs/${createdBlog.id}/publish`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to publish blog');
      }

      setCreatedBlog(data.blog);
      setSuccess('Post published successfully');
      setTimeout(() => {
        navigate('/');
      }, 800);
    } catch (err) {
      setError(err.message || 'Failed to publish blog');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-content">
      <section className="auth-section">
        <div className="auth-container">
          <h1>Create Blog Post</h1>
          <p className="auth-subtitle">Write a post and choose draft or published</p>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Enter a title"
              />
            </div>

            <div className="form-group">
              <label htmlFor="content">Content</label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                placeholder="Write your post..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Post'}
            </button>
          </form>

          {createdBlog?.status === 'draft' && (
            <div style={{ marginTop: '1rem' }}>
              <button className="btn-submit" onClick={handlePublish} disabled={loading} type="button">
                {loading ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default CreatePost;

