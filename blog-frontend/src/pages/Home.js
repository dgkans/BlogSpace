import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
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
        <Link to="#" className="cta-button primary large">Sign Up Now</Link>
      </section>
    </main>
  );
}

export default Home;
