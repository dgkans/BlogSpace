import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function ViewPost() {
  const { blogId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [blog, setBlog] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`http://localhost:5001/api/blogs/public/${blogId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Failed to load blog');
        }

        setBlog(data.blog);
      } catch (err) {
        setError(err.message || 'Failed to load blog');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [blogId]);

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
        <button type="button" className="btn-submit" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </main>
    );
  }

  if (!blog) return null;

  return (
    <main className="page-content">
      <section className="page-section">
        <div className="view-actions">
          <button type="button" className="btn-submit" onClick={() => navigate('/')}>
            Back
          </button>
        </div>

        <h1 className="view-title">{blog.title}</h1>
        <p className="view-meta">
          {blog.author?.full_name ? blog.author.full_name : 'Unknown'} ·{' '}
          {new Date(blog.created_at).toLocaleDateString()}
        </p>

        <div className="view-content">{blog.content}</div>
      </section>
    </main>
  );
}

export default ViewPost;

