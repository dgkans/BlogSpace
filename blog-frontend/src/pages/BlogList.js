import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { blogApi } from '../utils/blogApi';
import './BlogPages.css';

function BlogList() {
  const { token } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBlogs = async () => {
      if (!token) {
        return;
      }

      try {
        const data = await blogApi.list(token);
        setBlogs(data.blogs || []);
        setError('');
      } catch (err) {
        setError(err.message || 'Failed to load blogs');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, [token]);

  const handleDelete = async (blogId) => {
    const shouldDelete = window.confirm('Delete this blog post?');
    if (!shouldDelete) {
      return;
    }

    try {
      await blogApi.remove(token, blogId);
      setBlogs((prev) => prev.filter((blog) => blog.id !== blogId));
    } catch (err) {
      setError(err.message || 'Failed to delete blog');
    }
  };

  const handlePublish = async (blogId) => {
    try {
      const data = await blogApi.publish(token, blogId);
      setBlogs((prev) =>
        prev.map((blog) =>
          blog.id === blogId
            ? { ...blog, status: data.blog.status, publishedAt: data.blog.publishedAt }
            : blog
        )
      );
    } catch (err) {
      setError(err.message || 'Failed to publish blog');
    }
  };

  if (loading) {
    return <main className="page-content"><div className="loading">Loading blogs...</div></main>;
  }

  return (
    <main className="page-content blog-page">
      <section className="blog-list-header">
        <div>
          <h1>My Blog Posts</h1>
          <p>Write, save drafts, preview, and publish when ready.</p>
        </div>
        <Link to="/blogs/new" className="btn-primary">New Post</Link>
      </section>

      {error && <div className="error-message">{error}</div>}

      {blogs.length === 0 ? (
        <section className="blog-empty-state">
          <h2>No blog posts yet</h2>
          <p>Create your first post and save it as draft or publish directly.</p>
          <Link to="/blogs/new" className="btn-primary">Create First Post</Link>
        </section>
      ) : (
        <section className="blog-list-grid">
          {blogs.map((blog) => (
            <article className="blog-list-card" key={blog.id}>
              <div className="blog-card-meta">
                <span className={`status-badge status-${blog.status}`}>{blog.status}</span>
                <span>
                  Updated {new Date(blog.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <h2>{blog.title}</h2>
              <p>{blog.summary || 'No summary provided.'}</p>
              <div className="blog-card-actions">
                <Link to={`/blogs/${blog.id}`} className="btn-link">View</Link>
                <Link to={`/blogs/${blog.id}/edit`} className="btn-link">Edit</Link>
                {blog.status === 'draft' && (
                  <button className="btn-link" onClick={() => handlePublish(blog.id)}>Publish</button>
                )}
                <button className="btn-link danger" onClick={() => handleDelete(blog.id)}>Delete</button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

export default BlogList;
