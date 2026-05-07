import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { blogApi } from '../utils/blogApi';

const stripHtml = (html = '') => html.replace(/<[^>]*>/g, ' ');

const estimateReadTime = (blog) => {
  const text = stripHtml(blog.contentHtml || '') + ' ' + (blog.title || '') + ' ' + (blog.summary || '');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

function SavedPosts() {
  const { token } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setLoading(true);
      setError('');
      try {
        const data = await blogApi.listBookmarks(token);
        setBlogs(data.blogs || []);
      } catch (err) {
        setError(err.message || 'Could not load saved posts');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const formatDate = (value) => {
    if (!value) return 'Unknown date';
    return new Date(value).toLocaleDateString();
  };

  const onRemoveBookmark = async (blog) => {
    if (!token) return;
    setBusyId(blog.id);
    setError('');
    try {
      const data = await blogApi.togglePublishedBookmark(token, blog.id);
      if (!data.bookmarked) {
        setBlogs((prev) => prev.filter((b) => b.id !== blog.id));
      }
    } catch (err) {
      setError(err.message || 'Could not update bookmark');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <main className="page-content blog-page">
        <div className="home-published-empty">
          <div className="loading-spinner" />
          <p>Loading saved posts…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-content blog-page">
      <section className="blog-list-header">
        <div>
          <h1>Saved posts</h1>
          <p>
            {blogs.length === 0
              ? 'Posts you bookmark from the home feed or article pages appear here.'
              : `${blogs.length} saved post${blogs.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <Link to="/" className="btn-link">← Browse stories</Link>
      </section>

      {error && <p className="home-published-error">{error}</p>}

      {!loading && blogs.length === 0 && !error && (
        <div className="home-published-empty">
          <div className="empty-icon">🔖</div>
          <h3>No saved posts yet</h3>
          <p>Open a published story and tap Save to keep it on this list.</p>
          <Link to="/" className="cta-button primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
            Go to home
          </Link>
        </div>
      )}

      <div className="home-published-grid">
        {blogs.map((blog) => (
          <article key={blog.id} className="home-published-card">
            {blog.thumbnailUrl && (
              <div className="card-thumbnail">
                <img src={blog.thumbnailUrl} alt={blog.title} />
              </div>
            )}
            {!blog.thumbnailUrl && <div className="card-top-bar" />}
            <div className="card-body">
              <div className="home-published-meta">
                <span className="meta-author">
                  <span className="author-avatar">{(blog.author?.fullName || 'U')[0].toUpperCase()}</span>
                  {blog.author?.fullName || 'Unknown Author'}
                </span>
                <span className="meta-right">
                  <span>{estimateReadTime(blog)} min read</span>
                  <span className="meta-dot">·</span>
                  <span>{formatDate(blog.publishedAt)}</span>
                </span>
              </div>
              <h3 className="card-title">{blog.title}</h3>
              <p className="card-summary">{blog.summary || 'No summary provided.'}</p>
              <div className="home-published-card-footer">
                <button
                  type="button"
                  className="home-bookmark-btn on"
                  disabled={busyId === blog.id}
                  onClick={() => onRemoveBookmark(blog)}
                >
                  {busyId === blog.id ? '…' : '★ Saved'}
                </button>
                <Link to={`/blogs/public/${blog.id}`} className="card-read-link">
                  Read →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

export default SavedPosts;
