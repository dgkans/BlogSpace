import React, { useState } from 'react';

function ContactUs() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setForm({ name: '', email: '', message: '' });
  };

  const socialLinks = [
    { label: 'Twitter',   href: 'https://twitter.com',   icon: '𝕏',  color: '#000' },
    { label: 'LinkedIn',  href: 'https://linkedin.com',  icon: 'in', color: '#0a66c2' },
    { label: 'Instagram', href: 'https://instagram.com', icon: '📸', color: '#e1306c' },
    { label: 'GitHub',    href: 'https://github.com',    icon: '⌥',  color: '#24292f' },
  ];

  return (
    <main>
      {/* Page hero */}
      <section className="contact-hero">
        <div className="contact-hero-inner">
          <h1>Get in Touch</h1>
          <p>Have a question, idea, or just want to say hi? We'd love to hear from you.</p>
        </div>
      </section>

      <div className="page-content">
        <div className="contact-layout">

          {/* Left — form */}
          <div className="contact-form-card">
            <h2>Send us a message</h2>
            <p className="contact-form-desc">We typically respond within 24 hours.</p>

            {sent && (
              <div className="contact-success">
                ✅ Message sent! We'll get back to you soon.
              </div>
            )}

            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="contact-name">Your Name</label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="contact-email">Email Address</label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  placeholder="jane@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="contact-message">Message</label>
                <textarea
                  id="contact-message"
                  name="message"
                  placeholder="Tell us what's on your mind…"
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  required
                />
              </div>
              <button type="submit" className="btn-submit contact-submit">Send Message</button>
            </form>
          </div>

          {/* Right — info */}
          <div className="contact-info-col">
            <div className="contact-info-card">
              <div className="contact-info-icon">📧</div>
              <h3>Email Us</h3>
              <p>hello@blogspace.io</p>
            </div>
            <div className="contact-info-card">
              <div className="contact-info-icon">🕐</div>
              <h3>Response Time</h3>
              <p>Within 24 hours on weekdays</p>
            </div>
            <div className="contact-info-card">
              <div className="contact-info-icon">🌍</div>
              <h3>Location</h3>
              <p>Remote-first team, worldwide</p>
            </div>

            <div className="contact-social-block">
              <h3>Follow Us</h3>
              <div className="contact-social-links">
                {socialLinks.map(({ label, href, icon, color }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-social-btn"
                    style={{ '--social-color': color }}
                  >
                    <span className="social-icon">{icon}</span>
                    <span>{label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default ContactUs;
