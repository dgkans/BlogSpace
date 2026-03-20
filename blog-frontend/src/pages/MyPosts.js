import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function MyPosts() {
  const { user, token } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBlogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5001/api/blogs/mine', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to load posts');
      }

      setBlogs(data.blogs || []);
    } catch (err) {
      setError(err.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, []);

  const handlePublish = async (blogId) => {
    setError('');
    try {
      const res = await fetch(`http://localhost:5001/api/blogs/${blogId}/publish`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to publish');
      }

      await loadBlogs();
    } catch (err) {
      setError(err.message || 'Failed to publish');
    }
  };

  const handleDelete = async (blogId) => {
    setError('');
    const ok = window.confirm('Delete this blog?');
    if (!ok) return;

    try {
      const res = await fetch(`http://localhost:5001/api/blogs/${blogId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete');
      }

      await loadBlogs();
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <main className="page-content">
        <div className="loading">Loading posts...</div>
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
        <h1>My Posts</h1>

        {blogs.length === 0 ? (
          <p className="muted">No posts yet. Create one to get started.</p>
        ) : (
          <div className="my-posts-list">
            {blogs.map((b) => (
              <div key={b.id} className="my-post-card">
                <div className="my-post-head">
                  <h3 className="my-post-title">{b.title}</h3>
                  <span className={`badge ${b.status}`}>{b.status}</span>
                </div>

                <p className="my-post-meta">
                  {new Date(b.created_at).toLocaleDateString()}
                </p>

                <div className="my-post-actions">
                  <Link to={`/edit-post/${b.id}`} className="btn-link">
                    Edit
                  </Link>

                  {b.status === 'published' && (
                    <Link to={`/blog/${b.id}`} className="btn-submit">
                      View
                    </Link>
                  )}

                  {b.status === 'draft' && (
                    <button
                      type="button"
                      className="btn-submit"
                      onClick={() => handlePublish(b.id)}
                    >
                      Publish
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => handleDelete(b.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default MyPosts;

