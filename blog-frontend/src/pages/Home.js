import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { blogApi } from '../utils/blogApi';
import { useAuth } from '../context/AuthContext';

function Home() {
  const { token, user } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState('all');
  const [sort, setSort] = useState('newest');
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyReactionId, setBusyReactionId] = useState(null);
  const [reactionHint, setReactionHint] = useState('');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    const fetchPublishedBlogs = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await blogApi.listPublished({ q: searchQuery, period, sort, token });
        setBlogs(data.blogs || []);
      } catch (fetchError) {
        setError(fetchError.message || 'Could not load published blogs');
      } finally {
        setLoading(false);
      }
    };

    fetchPublishedBlogs();
  }, [searchQuery, period, sort, token]);

  const resultLabel = useMemo(() => {
    if (loading) return 'Loading published blogs...';
    return `${blogs.length} published blog${blogs.length === 1 ? '' : 's'}`;
  }, [blogs.length, loading]);

  const formatDate = (value) => {
    if (!value) return 'Unknown date';
    return new Date(value).toLocaleDateString();
  };

  const isOwnPost = (blog) => user && blog.author?.id && String(blog.author.id) === String(user.id);

  const onLikeClick = async (blog, ev) => {
    ev.preventDefault();
    setReactionHint('');
    if (!token) {
      setReactionHint('Sign in to react to posts.');
      return;
    }
    if (isOwnPost(blog)) return;

    setBusyReactionId(blog.id);
    try {
      const data = await blogApi.togglePublishedLike(token, blog.id);
      setBlogs((prev) =>
        prev.map((b) =>
          b.id === blog.id
            ? {
                ...b,
                likeCount: data.likeCount,
                liked: data.liked,
                dislikeCount: data.dislikeCount,
                disliked: data.disliked,
              }
            : b
        )
      );
    } catch (err) {
      setReactionHint(err.message || 'Like did not go through.');
    } finally {
      setBusyReactionId(null);
    }
  };

  const onDislikeClick = async (blog, ev) => {
    ev.preventDefault();
    setReactionHint('');
    if (!token) {
      setReactionHint('Sign in to react to posts.');
      return;
    }
    if (isOwnPost(blog)) return;

    setBusyReactionId(blog.id);
    try {
      const data = await blogApi.togglePublishedDislike(token, blog.id);
      setBlogs((prev) =>
        prev.map((b) =>
          b.id === blog.id
            ? {
                ...b,
                likeCount: data.likeCount,
                liked: data.liked,
                dislikeCount: data.dislikeCount,
                disliked: data.disliked,
              }
            : b
        )
      );
    } catch (err) {
      setReactionHint(err.message || 'Dislike did not go through.');
    } finally {
      setBusyReactionId(null);
    }
  };

  const estimateReadTime = (blog) => {
    const words = ((blog.summary || '') + ' ' + (blog.title || '')).split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  return (
    <main>
      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge">Open Platform · Free to Read</div>
          <h1 className="hero-title">
            Ideas worth reading,<br />
            <span className="hero-title-accent">stories worth telling.</span>
          </h1>
          <p className="hero-subtitle">
            A community-driven blog platform where writers share knowledge,
            experiences, and perspectives. Discover fresh posts every day or
            start writing your own.
          </p>
          <div className="cta-buttons">
            <Link to="/blogs/new" className="cta-button primary">Start Writing</Link>
            <Link to="/about" className="cta-button secondary">Learn More</Link>
          </div>
        </div>
      </section>

      {/* Platform stats */}
      <section className="stats-bar">
        <div className="stats-bar-inner">
          <div className="stat-item">
            <span className="stat-number">{blogs.length > 0 ? `${blogs.length}+` : '—'}</span>
            <span className="stat-label">Published Posts</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-number">100%</span>
            <span className="stat-label">Free to Read</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-number">Rich</span>
            <span className="stat-label">Text Editor</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-number">Real-time</span>
            <span className="stat-label">Reactions</span>
          </div>
        </div>
      </section>

      <div className="page-content">
        {/* Blog listing */}
        <section className="home-published-section">
          <div className="home-published-header">
            <div>
              <h2>Latest Stories</h2>
              <p className="section-subtitle">{resultLabel}</p>
            </div>

            <div className="home-published-controls" aria-label="Blog search and filters">
              <input
                type="search"
                placeholder="Search title, summary, or content…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />

              <select value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option value="all">All time</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="1y">Last year</option>
              </select>

              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
          </div>

          {error && <p className="home-published-error">{error}</p>}
          {reactionHint && <p className="home-published-error">{reactionHint}</p>}

          {!loading && blogs.length === 0 && !error && (
            <div className="home-published-empty">
              <div className="empty-icon">📭</div>
              <h3>No published blogs found</h3>
              <p>Try changing the search or filters, or be the first to publish a post.</p>
              <Link to="/blogs/new" className="cta-button primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Write the first post</Link>
            </div>
          )}

          <div className="home-published-grid">
            {blogs.map((blog) => (
              <article key={blog.id} className="home-published-card">
                <div className="card-top-bar" />
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
                    <div className="home-like-block">
                      {isOwnPost(blog) ? (
                        <span className="home-like-note">Your post</span>
                      ) : (
                        <>
                          <button
                            type="button"
                            className={blog.liked ? 'home-like-btn on' : 'home-like-btn'}
                            disabled={busyReactionId === blog.id}
                            onClick={(ev) => onLikeClick(blog, ev)}
                          >
                            {blog.liked ? '♥' : '♡'} {blog.likeCount ?? 0}
                          </button>
                          <button
                            type="button"
                            className={blog.disliked ? 'home-dislike-btn on' : 'home-dislike-btn'}
                            disabled={busyReactionId === blog.id}
                            onClick={(ev) => onDislikeClick(blog, ev)}
                          >
                            👎 {blog.dislikeCount ?? 0}
                          </button>
                        </>
                      )}
                    </div>
                    <Link to={`/blogs/public/${blog.id}`} className="card-read-link">
                      Read →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
            {loading && (
              <div className="home-published-empty">
                <div className="loading-spinner" />
                <p>Loading posts…</p>
              </div>
            )}
          </div>
        </section>

        {/* Features */}
        <section className="features">
          <div className="features-header">
            <h2>Why write here?</h2>
            <p>Everything you need to share ideas with the world.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrap feature-icon-blue">✍️</div>
              <h3>Rich Text Editor</h3>
              <p>Write with a powerful editor that supports headings, bold, italic, lists, links, and more — no Markdown required.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrap feature-icon-green">🌐</div>
              <h3>Instant Publishing</h3>
              <p>Go from draft to live post in one click. Your story becomes publicly accessible the moment you publish it.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrap feature-icon-amber">🔍</div>
              <h3>Search & Filter</h3>
              <p>Readers can search by keyword, filter by publish date, and sort posts exactly how they want.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrap feature-icon-red">❤️</div>
              <h3>Reader Reactions</h3>
              <p>Let your audience engage with likes and dislikes. Real feedback from real readers on every post.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrap feature-icon-purple">🔒</div>
              <h3>Secure Accounts</h3>
              <p>JWT-based authentication keeps your account safe. Only you can edit or delete your own posts.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrap feature-icon-teal">📊</div>
              <h3>Draft Management</h3>
              <p>Save drafts privately and publish when you're ready. Full CRUD control over all your writing.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <div className="cta-section-inner">
            <h2>Ready to share your story?</h2>
            <p>Join the community and start publishing today — it's completely free.</p>
            <div className="cta-buttons">
              <Link to="/register" className="cta-button primary large">Create a free account</Link>
              <Link to="/login" className="cta-button secondary large">Sign in</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Home;
