import React from 'react';

const TEAM = [
  {
    name: 'Gaurav',
    role: 'Full Stack Developer',
    description: 'Expert in backend architecture and API design. Passionate about building scalable, resilient systems.',
    gradient: 'linear-gradient(135deg, #2563eb, #7c3aed)',
  },
  {
    name: 'Anuj',
    role: 'Full Stack Developer',
    description: 'Specialises in crafting intuitive interfaces and seamless user experiences that delight every visitor.',
    gradient: 'linear-gradient(135deg, #0891b2, #2563eb)',
  },
  {
    name: 'Mukul',
    role: 'Full Stack Developer',
    description: 'Focused on database optimisation and system performance. Loves untangling complex engineering problems.',
    gradient: 'linear-gradient(135deg, #7c3aed, #db2777)',
  },
];

const VALUES = [
  { icon: '🎯', title: 'Simplicity',  text: 'Intuitive design that anyone can use effortlessly, no manual needed.' },
  { icon: '🤝', title: 'Community',   text: 'We foster connections and encourage collaboration among our users.' },
  { icon: '💡', title: 'Innovation',  text: 'We continuously ship improvements based on real user feedback.' },
  { icon: '🔒', title: 'Security',    text: 'Your privacy and content are protected with industry best practices.' },
];

function AboutUs() {
  return (
    <main>
      {/* Hero */}
      <section className="about-hero">
        <div className="about-hero-inner">
          <div className="about-hero-badge">Our Story</div>
          <h1>Built by writers,<br /><span className="about-hero-accent">for writers.</span></h1>
          <p>
            Blogspace started as a passion project among three developers who wanted
            a platform that's powerful yet simple — where ideas take centre stage.
          </p>
        </div>
      </section>

      <div className="page-content">

        {/* Mission + Vision */}
        <section className="about-mv-grid">
          <div className="about-mv-card">
            <div className="about-mv-icon">🚀</div>
            <h2>Our Mission</h2>
            <p>
              We believe everyone has a story to tell. Blogspace is dedicated to providing
              a modern, user-friendly platform where writers, creators, and thinkers can
              share their ideas freely — without the complexity.
            </p>
          </div>
          <div className="about-mv-card">
            <div className="about-mv-icon">🌟</div>
            <h2>Our Vision</h2>
            <p>
              An inclusive digital space where creativity thrives, diverse voices are heard,
              and meaningful connections are made. Technology should empower expression,
              not get in the way of it.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="about-values-section">
          <div className="about-section-header">
            <h2>Core Values</h2>
            <p>The principles that guide every decision we make.</p>
          </div>
          <div className="about-values-grid">
            {VALUES.map(({ icon, title, text }) => (
              <div key={title} className="about-value-card">
                <div className="about-value-icon">{icon}</div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="about-team-section">
          <div className="about-section-header">
            <h2>Meet the Team</h2>
            <p>Three developers, one shared obsession with great software.</p>
          </div>
          <div className="about-team-grid">
            {TEAM.map(({ name, role, description, gradient }) => (
              <div key={name} className="about-team-card">
                <div className="about-team-avatar" style={{ background: gradient }}>
                  {name.charAt(0)}
                </div>
                <h3>{name}</h3>
                <span className="about-team-role">{role}</span>
                <p>{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Story */}
        <section className="about-story-section">
          <div className="about-story-inner">
            <h2>How it started</h2>
            <p>
              Blog App was born out of a simple observation: the world needed a blogging platform
              that combines powerful features with ease of use. We started this project with a vision
              to create a space where anyone could publish their thoughts, connect with like-minded
              individuals, and build their personal brand.
            </p>
            <p>
              What began as a side project among three developers has grown into a comprehensive
              platform. We continue to ship improvements based on user feedback, always keeping
              the creator's experience at the heart of every decision.
            </p>
          </div>
        </section>

      </div>
    </main>
  );
}

export default AboutUs;
