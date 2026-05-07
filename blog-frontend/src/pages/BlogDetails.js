import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { blogApi } from '../utils/blogApi';

function BlogDetails() {
  const { blogId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const data = await blogApi.getById(token, blogId);
        setBlog(data.blog);
      } catch (err) {
        setError(err.message || 'Failed to load blog');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchBlog();
    }
  }, [token, blogId]);

  const handleDelete = async () => {
    const shouldDelete = window.confirm('Delete this blog post?');
    if (!shouldDelete) {
      return;
    }

    try {
      await blogApi.remove(token, blogId);
      navigate('/blogs');
    } catch (err) {
      setError(err.message || 'Failed to delete blog');
    }
  };

  if (loading) {
    return <main className="page-content"><div className="loading">Loading blog...</div></main>;
  }

  if (error) {
    return <main className="page-content"><div className="error-message">{error}</div></main>;
  }

  if (!blog) {
    return <main className="page-content"><div className="error-message">Blog not found.</div></main>;
  }

  const fmt = (val, opts = {}) =>
    new Date(val).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', ...opts });

  return (
    <main className="page-content blog-page">
      {/* Header card */}
      <section className="blog-owner-header">
        <div className="blog-owner-header-top">
          <Link to="/blogs" className="editor-back-link">← My Posts</Link>
          <div className="blog-owner-actions">
            <Link to={`/blogs/${blog.id}/edit`} className="btn-detail-edit">Edit</Link>
            <button className="btn-detail-delete" onClick={handleDelete}>Delete</button>
          </div>
        </div>

        <div className="blog-owner-status-row">
          <span className={`status-badge status-${blog.status}`}>{blog.status}</span>
          {blog.status === 'published' && blog.publishedAt && (
            <span className="blog-owner-date">Published {fmt(blog.publishedAt)}</span>
          )}
          {blog.updatedAt && (
            <span className="blog-owner-date">· Updated {fmt(blog.updatedAt)}</span>
          )}
        </div>

        <h1 className="blog-owner-title">{blog.title}</h1>

        {blog.summary && (
          <p className="blog-owner-summary">{blog.summary}</p>
        )}

        {blog.tags?.length > 0 && (
          <div className="blog-owner-tags">
            {blog.tags.map((tag) => (
              <span key={tag} className="tag-chip">{tag}</span>
            ))}
          </div>
        )}
      </section>

      {/* Cover image */}
      {blog.thumbnailUrl && (
        <div className="blog-owner-cover">
          <img src={blog.thumbnailUrl} alt={blog.title} />
        </div>
      )}

      {/* Content */}
      <article className="blog-rendered-content" dangerouslySetInnerHTML={{ __html: blog.contentHtml }} />

      {/* Footer action bar */}
      <div className="blog-owner-footer">
        <span className="blog-owner-footer-meta">
          {blog.status === 'published'
            ? `Published ${fmt(blog.publishedAt)}`
            : `Draft · last saved ${fmt(blog.updatedAt)}`}
        </span>
        <div className="blog-owner-footer-actions">
          <Link to={`/blogs/${blog.id}/edit`} className="btn-detail-edit">Edit Post</Link>
          <button className="btn-detail-delete" onClick={handleDelete}>Delete</button>
        </div>
      </div>
    </main>
  );
}

export default BlogDetails;
