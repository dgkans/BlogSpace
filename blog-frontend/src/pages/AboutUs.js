import React from 'react';

function AboutUs() {
  const teamMembers = [
    {
      name: 'Gaurav',
      role: 'Full Stack Developer',
      description: 'Expert in backend architecture and API design. Passionate about building scalable solutions.'
    },
    {
      name: 'Anuj',
      role: 'Frontend Developer',
      description: 'Specialized in creating intuitive user interfaces and seamless user experiences.'
    },
    {
      name: 'Mukul',
      role: 'Full Stack Developer',
      description: 'Focused on database optimization and system performance. Loves solving complex problems.'
    }
  ];

  return (
    <main className="page-content">
      <section className="about-section">
        <div className="about-header">
          <h1>About Us</h1>
          <p className="about-tagline">Building the future of blogging, one post at a time</p>
        </div>

        <div className="about-content">
          <section className="mission-section">
            <h2>Our Mission</h2>
            <p>
              We believe everyone has a story to tell. Blog App is dedicated to providing a modern,
              user-friendly platform where writers, creators, and thinkers can share their ideas with
              the world. Our mission is to democratize content creation and foster a vibrant community
              of bloggers.
            </p>
          </section>

          <section className="vision-section">
            <h2>Our Vision</h2>
            <p>
              To create an inclusive digital space where creativity thrives, diverse voices are heard,
              and meaningful connections are made. We envision a world where technology empowers
              individuals to express themselves freely and discover content that inspires them.
            </p>
          </section>

          <section className="values-section">
            <h2>Our Core Values</h2>
            <div className="values-grid">
              <div className="value-card">
                <div className="value-icon">🎯</div>
                <h3>Simplicity</h3>
                <p>We believe in intuitive design that anyone can use effortlessly.</p>
              </div>
              <div className="value-card">
                <div className="value-icon">🤝</div>
                <h3>Community</h3>
                <p>We foster connections and encourage collaboration among our users.</p>
              </div>
              <div className="value-card">
                <div className="value-icon">💡</div>
                <h3>Innovation</h3>
                <p>We continuously improve and innovate to serve our community better.</p>
              </div>
              <div className="value-card">
                <div className="value-icon">🔒</div>
                <h3>Security</h3>
                <p>We prioritize your privacy and protect your content with industry standards.</p>
              </div>
            </div>
          </section>

          <section className="team-section">
            <h2>Our Team</h2>
            <p className="team-intro">
              Meet the passionate developers behind Blog App. We're a dedicated team committed to
              delivering the best blogging experience.
            </p>
            <div className="team-grid">
              {teamMembers.map((member) => (
                <div key={member.name} className="team-card">
                  <div className="team-avatar">{member.name.charAt(0)}</div>
                  <h3>{member.name}</h3>
                  <p className="team-role">{member.role}</p>
                  <p className="team-description">{member.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="story-section">
            <h2>Our Story</h2>
            <p>
              Blog App was born out of a simple observation: the world needed a blogging platform
              that combines powerful features with ease of use. We started this project with a vision
              to create a space where anyone could publish their thoughts, connect with like-minded
              individuals, and build their personal brand.
            </p>
            <p>
              What began as a passion project among three developers has evolved into a comprehensive
              blogging platform. Today, we continue to innovate and enhance our platform based on user
              feedback, always keeping the creator's experience at the heart of our decisions.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}

export default AboutUs;
