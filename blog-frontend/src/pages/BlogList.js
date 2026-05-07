import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { blogApi } from '../utils/blogApi';

function BlogList() {
  const { token } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBlogs = async () => {
      if (!token) return;
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
    if (!window.confirm('Delete this blog post? This cannot be undone.')) return;
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

  const drafts = blogs.filter((b) => b.status === 'draft');
  const published = blogs.filter((b) => b.status === 'published');

  if (loading) {
    return (
      <main className="page-content blog-page">
        <div className="home-published-empty">
          <div className="loading-spinner" />
          <p>Loading your posts…</p>
        </div>
      </main>
    );
  }

  const renderCard = (blog) => (
    <article className={`my-post-card status-${blog.status}`} key={blog.id}>
      <div className="my-post-card-inner">
        {blog.thumbnailUrl && (
          <div className="my-post-thumb">
            <img src={blog.thumbnailUrl} alt={blog.title} />
          </div>
        )}
        <div className="my-post-body">
          <div className="my-post-head">
            <div>
              <h2 className="my-post-title">{blog.title || 'Untitled'}</h2>
              <p className="my-post-meta">
                Updated {new Date(blog.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {blog.status === 'published' && blog.publishedAt && (
                  <> · Published {new Date(blog.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>
                )}
              </p>
            </div>
            <span className={`status-badge status-${blog.status}`}>{blog.status}</span>
          </div>

          {blog.summary && (
            <p className="my-post-summary">{blog.summary}</p>
          )}

          {blog.tags?.length > 0 && (
            <div className="blog-list-tags">
              {blog.tags.map((tag) => <span key={tag} className="tag-chip">{tag}</span>)}
            </div>
          )}

          <div className="my-post-actions">
            <Link to={`/blogs/${blog.id}`} className="btn-link view-btn">View</Link>
            <Link to={`/blogs/${blog.id}/edit`} className="btn-link edit-btn">Edit</Link>
            {blog.status === 'draft' && (
              <button className="btn-link publish-btn" onClick={() => handlePublish(blog.id)}>
                Publish
              </button>
            )}
            {blog.status === 'published' && (
              <Link to={`/blogs/public/${blog.id}`} className="btn-link public-btn" target="_blank" rel="noopener noreferrer">
                Public View ↗
              </Link>
            )}
            <button className="btn-link danger" onClick={() => handleDelete(blog.id)}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </article>
  );

  return (
    <main className="page-content blog-page">
      <section className="my-posts-header">
        <div>
          <h1>My Blog Posts</h1>
          <div className="my-posts-stats">
            <span className="stat-pill stat-published">{published.length} published</span>
            <span className="stat-pill stat-draft">{drafts.length} draft{drafts.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <Link to="/blogs/new" className="btn-new-post">+ New Post</Link>
      </section>

      {error && <div className="error-message">{error}</div>}

      {blogs.length === 0 ? (
        <section className="blog-empty-state">
          <div className="empty-icon-svg"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg></div>
          <h2>No blog posts yet</h2>
          <p>Create your first post and save it as a draft or publish directly.</p>
          <Link to="/blogs/new" className="btn-primary">Create First Post</Link>
        </section>
      ) : (
        <div className="my-posts-list">
          {published.length > 0 && (
            <>
              <div className="posts-section-label">Published · {published.length}</div>
              {published.map(renderCard)}
            </>
          )}
          {drafts.length > 0 && (
            <>
              <div className="posts-section-label">Drafts · {drafts.length}</div>
              {drafts.map(renderCard)}
            </>
          )}
        </div>
      )}
    </main>
  );
}

export default BlogList;
