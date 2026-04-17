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
  const [busyLikeId, setBusyLikeId] = useState(null);
  const [likeHint, setLikeHint] = useState('');

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
    setLikeHint('');
    if (!token) {
      setLikeHint('Sign in to like posts.');
      return;
    }
    if (isOwnPost(blog)) return;

    setBusyLikeId(blog.id);
    try {
      const data = await blogApi.togglePublishedLike(token, blog.id);
      setBlogs((prev) =>
        prev.map((b) =>
          b.id === blog.id ? { ...b, likeCount: data.likeCount, liked: data.liked } : b
        )
      );
    } catch (err) {
      setLikeHint(err.message || 'Like did not go through.');
    } finally {
      setBusyLikeId(null);
    }
  };

  return (
    <main className="page-content">
      <section className="hero">
        <h1>Welcome to Blog App</h1>
        <p>Explore published stories from the community. Search by keyword, filter by publish window, and sort by date.</p>
        <div className="cta-buttons">
          <Link to="/blogs/new" className="cta-button primary">Write a Blog</Link>
          <Link to="/about" className="cta-button secondary">Learn More</Link>
        </div>
      </section>

      <section className="home-published-section">
        <div className="home-published-header">
          <div>
            <h2>Published Blogs</h2>
            <p>{resultLabel}</p>
          </div>

          <div className="home-published-controls" aria-label="Blog search and filters">
            <input
              type="search"
              placeholder="Search title, summary, or content"
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
        {likeHint && <p className="home-published-error">{likeHint}</p>}

        {!loading && blogs.length === 0 && !error && (
          <div className="home-published-empty">
            <h3>No published blogs found</h3>
            <p>Try changing search or filters, or publish a new blog post.</p>
          </div>
        )}

        <div className="home-published-grid">
          {blogs.map((blog) => (
            <article key={blog.id} className="home-published-card">
              <div className="home-published-meta">
                <span>By {blog.author?.fullName || 'Unknown Author'}</span>
                <span>{formatDate(blog.publishedAt)}</span>
              </div>
              <h3>{blog.title}</h3>
              <p>{blog.summary || 'No summary provided.'}</p>
              <div className="home-published-card-footer">
                <div className="home-like-block">
                  {isOwnPost(blog) ? (
                    <span className="home-like-note">Your post</span>
                  ) : (
                    <button
                      type="button"
                      className={blog.liked ? 'home-like-btn on' : 'home-like-btn'}
                      disabled={busyLikeId === blog.id}
                      onClick={(ev) => onLikeClick(blog, ev)}
                    >
                      {blog.liked ? '♥ Liked' : '♡ Like'} · {blog.likeCount ?? 0}
                    </button>
                  )}
                </div>
                <Link to={`/blogs/public/${blog.id}`} className="btn-link">
                  Read more
                </Link>
              </div>
            </article>
          ))}
          {loading && (
            <div className="home-published-empty">
              <p>Loading published blogs...</p>
            </div>
          )}
        </div>
      </section>

      <section className="features">
        <h2>Why Choose Our Platform?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">✍️</div>
            <h3>Create & Publish</h3>
            <p>Easily write, edit, and publish your blog posts with our intuitive editor. Share your thoughts with the world.</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to Start Blogging?</h2>
        <p>Join thousands of writers sharing their stories on our platform.</p>
        <Link to="#" className="cta-button primary large">Sign Up Now</Link>
      </section>
    </main>
  );
}

export default Home;
