import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { blogApi } from '../utils/blogApi';

const fmtShortDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const fillDays = (data, days = 30) => {
  const map = new Map(data.map((d) => [d.date, d.count]));
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, count: map.get(key) || 0 });
  }
  return result;
};

function BarChart({ data, color = '#2563eb', label = 'Views' }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const showEvery = Math.ceil(data.length / 7);

  return (
    <div className="analytics-chart-wrap">
      <div className="analytics-chart">
        {data.map((d, i) => (
          <div className="chart-col" key={d.date} title={`${fmtShortDate(d.date)}: ${d.count} ${label.toLowerCase()}`}>
            <div className="chart-bar-outer">
              <div
                className="chart-bar-inner"
                style={{ height: `${(d.count / max) * 100}%`, background: color }}
              />
            </div>
            <span className="chart-bar-label">
              {i % showEvery === 0 ? fmtShortDate(d.date) : ''}
            </span>
          </div>
        ))}
      </div>
      <div className="chart-y-label">{label}</div>
    </div>
  );
}

function BlogAnalytics() {
  const { blogId } = useParams();
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await blogApi.getAnalytics(token, blogId);
        setAnalytics(data.analytics);
      } catch (err) {
        setError(err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    if (token) load();
  }, [token, blogId]);

  if (loading) {
    return (
      <main className="page-content blog-page">
        <div className="home-published-empty">
          <div className="loading-spinner" />
          <p>Loading analytics…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page-content blog-page">
        <div className="error-message">{error}</div>
      </main>
    );
  }

  const { title, totalViews, totalLikes, totalDislikes, totalComments, viewsByDay, likesByDay, topReferrers } = analytics;
  const totalReactions = totalLikes + totalDislikes;
  const likeRatio = totalReactions > 0 ? Math.round((totalLikes / totalReactions) * 100) : 0;
  const filledViews = fillDays(viewsByDay, 30);
  const filledLikes = fillDays(likesByDay, 30);
  const totalReferrerViews = topReferrers.reduce((sum, r) => sum + r.count, 0) || 1;

  return (
    <main className="page-content blog-page">
      {/* Header */}
      <section className="analytics-header">
        <div className="analytics-header-left">
          <Link to={`/blogs/${blogId}`} className="editor-back-link">← Back to post</Link>
          <div>
            <h1 className="analytics-title">Analytics</h1>
            <p className="analytics-subtitle" title={title}>{title}</p>
          </div>
        </div>
        <span className="analytics-period-badge">Last 30 days</span>
      </section>

      {/* Stat cards */}
      <div className="analytics-stats-grid">
        <div className="analytics-stat-card">
          <span className="stat-card-icon">👁️</span>
          <span className="stat-card-value">{totalViews.toLocaleString()}</span>
          <span className="stat-card-label">Total Views</span>
        </div>
        <div className="analytics-stat-card">
          <span className="stat-card-icon">♥</span>
          <span className="stat-card-value">{totalLikes.toLocaleString()}</span>
          <span className="stat-card-label">Likes</span>
        </div>
        <div className="analytics-stat-card">
          <span className="stat-card-icon">👎</span>
          <span className="stat-card-value">{totalDislikes.toLocaleString()}</span>
          <span className="stat-card-label">Dislikes</span>
        </div>
        <div className="analytics-stat-card">
          <span className="stat-card-icon">💬</span>
          <span className="stat-card-value">{totalComments.toLocaleString()}</span>
          <span className="stat-card-label">Comments</span>
        </div>
      </div>

      {/* Views chart */}
      <div className="analytics-card">
        <h2 className="analytics-card-title">Views over time</h2>
        <p className="analytics-card-sub">Daily views for the last 30 days</p>
        <BarChart data={filledViews} color="#2563eb" label="Views" />
      </div>

      {/* Likes chart */}
      <div className="analytics-card">
        <h2 className="analytics-card-title">Likes over time</h2>
        <p className="analytics-card-sub">New likes per day for the last 30 days</p>
        <BarChart data={filledLikes} color="#22c55e" label="Likes" />
      </div>

      {/* Like / dislike ratio */}
      <div className="analytics-card">
        <h2 className="analytics-card-title">Like / Dislike ratio</h2>
        <p className="analytics-card-sub">
          {totalReactions > 0
            ? `${totalLikes} likes · ${totalDislikes} dislikes · ${likeRatio}% positive`
            : 'No reactions yet'}
        </p>
        {totalReactions > 0 && (
          <div className="ratio-bar-wrap">
            <div className="ratio-bar">
              <div className="ratio-bar-likes" style={{ width: `${likeRatio}%` }} />
              <div className="ratio-bar-dislikes" style={{ width: `${100 - likeRatio}%` }} />
            </div>
            <div className="ratio-bar-labels">
              <span className="ratio-label-like">♥ {likeRatio}% Liked</span>
              <span className="ratio-label-dislike">👎 {100 - likeRatio}% Disliked</span>
            </div>
          </div>
        )}
      </div>

      {/* Traffic sources */}
      <div className="analytics-card">
        <h2 className="analytics-card-title">Traffic sources</h2>
        <p className="analytics-card-sub">Where your readers are coming from</p>
        {topReferrers.length === 0 ? (
          <p className="analytics-empty-note">No view data recorded yet. Views are tracked from the moment this feature was enabled.</p>
        ) : (
          <ul className="referrer-list">
            {topReferrers.map((r) => {
              const pct = Math.round((r.count / totalReferrerViews) * 100);
              return (
                <li className="referrer-row" key={r.source}>
                  <div className="referrer-meta">
                    <span className="referrer-source">{r.source}</span>
                    <span className="referrer-count">{r.count.toLocaleString()} views</span>
                  </div>
                  <div className="referrer-bar-track">
                    <div className="referrer-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="referrer-pct">{pct}%</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

export default BlogAnalytics;
