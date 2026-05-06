import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { blogApi } from '../utils/blogApi';

function BlogList() {
  const { token } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('');
  const [sort, setSort] = useState('newest');

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

  const filteredBlogs = useMemo(() => {
    const normalizedTag = tagFilter.trim().toLowerCase();

    const byStatusAndTag = blogs.filter((blog) => {
      if (statusFilter !== 'all' && blog.status !== statusFilter) {
        return false;
      }

      if (!normalizedTag) return true;
      const tags = Array.isArray(blog.tags) ? blog.tags : [];
      return tags.some((t) => String(t).toLowerCase().includes(normalizedTag));
    });

    const sorted = [...byStatusAndTag].sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();

      if (sort === 'oldest') {
        return dateA - dateB;
      }

      if (sort === 'mostLiked') {
        const likeA = a.likeCount ?? 0;
        const likeB = b.likeCount ?? 0;
        if (likeB !== likeA) return likeB - likeA;
        return dateB - dateA;
      }

      // Default: newest first
      return dateB - dateA;
    });

    return sorted;
  }, [blogs, statusFilter, tagFilter, sort]);

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

  return (
    <main className="page-content blog-page">
      <section className="blog-list-header">
        <div>
          <h1>My Blog Posts</h1>
          <p>
            {blogs.length === 0
              ? 'No posts yet — create your first one.'
              : `${published.length} published · ${drafts.length} draft${drafts.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="editor-header-actions">
          <div className="home-published-controls" aria-label="Blog filters">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="mostLiked">Most liked</option>
            </select>
            <input
              type="search"
              placeholder="Filter by tag…"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
            />
          </div>
          <Link to="/blogs/new" className="btn-primary">+ New Post</Link>
        </div>
      </section>

      {error && <div className="error-message">{error}</div>}

      {filteredBlogs.length === 0 ? (
        <section className="blog-empty-state">
          <div className="empty-icon-svg"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg></div>
          <h2>No blog posts yet</h2>
          <p>Create your first post and save it as a draft or publish directly.</p>
          <Link to="/blogs/new" className="btn-primary">Create First Post</Link>
        </section>
      ) : (
        <div className="my-posts-list">
          {filteredBlogs.map((blog) => (
            <article className="my-post-card" key={blog.id}>
              <div className="my-post-card-inner">
                {/* Thumbnail */}
                {blog.thumbnailUrl && (
                  <div className="my-post-thumb">
                    <img src={blog.thumbnailUrl} alt={blog.title} />
                  </div>
                )}

                {/* Body */}
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
                    <Link to={`/blogs/${blog.id}`} className="btn-link">View</Link>
                    <Link to={`/blogs/${blog.id}/edit`} className="btn-link">Edit</Link>
                    {blog.status === 'draft' && (
                      <button className="btn-link publish-btn" onClick={() => handlePublish(blog.id)}>
                        Publish
                      </button>
                    )}
                    {blog.status === 'published' && (
                      <Link to={`/blogs/public/${blog.id}`} className="btn-link" target="_blank" rel="noopener noreferrer">
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
          ))}
        </div>
      )}
    </main>
  );
}

export default BlogList;
