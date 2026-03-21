import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function Home() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:5001/api/blogs/published');
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to load blogs');
        }
        setBlogs(data.blogs || []);
      } catch (e) {
        setBlogs([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <main className="page-content">
      <section className="hero">
        <h1>Welcome to Blog App</h1>
        <p>A full-stack blog application where users can register, create and manage posts, like content, and discover blogs from other users.</p>
        <div className="cta-buttons">
          <Link to="#" className="cta-button primary">Get Started</Link>
          <Link to="/about" className="cta-button secondary">Learn More</Link>
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
          <div className="feature-card">
            <div className="feature-icon">👍</div>
            <h3>Engage & Connect</h3>
            <p>Like and interact with content from other bloggers. Build a community around your interests.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Discover Content</h3>
            <p>Explore blogs from other users and find content that resonates with you. Stay inspired.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Manage Your Blog</h3>
            <p>Full control over your posts and profile. Track engagement and manage your content efficiently.</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to Start Blogging?</h2>
        <p>Join thousands of writers sharing their stories on our platform.</p>
      </section>

      <section className="blog-feed">
        <h2>Published Posts</h2>
        {loading ? (
          <p className="muted">Loading posts...</p>
        ) : blogs.length === 0 ? (
          <p className="muted">No published posts yet.</p>
        ) : (
          <div className="blog-grid">
            {blogs.map((b) => (
              <div key={b.id} className="blog-card">
                <h3 className="blog-card-title">{b.title}</h3>
                <p className="blog-card-meta">
                  {b.author?.full_name ? b.author.full_name : 'Unknown'} ·{' '}
                  {new Date(b.created_at).toLocaleDateString()}
                </p>
                <p className="blog-card-content">
                  {b.content.length > 240 ? `${b.content.slice(0, 240)}...` : b.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Home;
