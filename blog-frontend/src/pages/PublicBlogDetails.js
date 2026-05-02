import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { blogApi } from '../utils/blogApi';
import { useAuth } from '../context/AuthContext';

const stripHtml = (html = '') => html.replace(/<[^>]*>/g, ' ');

const estimateReadTime = (blog) => {
  const text = stripHtml(blog.contentHtml || '') + ' ' + (blog.title || '') + ' ' + (blog.summary || '');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

function PublicBlogDetails() {
  const { blogId } = useParams();
  const { token, user } = useAuth();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reactionBusy, setReactionBusy] = useState(false);
  const [reactionHint, setReactionHint] = useState('');

  useEffect(() => {
    const loadBlog = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await blogApi.getPublishedById(blogId, token);
        setBlog(data.blog);
      } catch (err) {
        setError(err.message || 'Failed to load blog details');
      } finally {
        setLoading(false);
      }
    };
    loadBlog();
  }, [blogId, token]);

  const formattedDate = blog?.publishedAt
    ? new Date(blog.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown publish date';

  const ownPost = user && blog?.author?.id && String(blog.author.id) === String(user.id);

  const onLike = async () => {
    setReactionHint('');
    if (!token) { setReactionHint('Sign in to react to posts.'); return; }
    if (ownPost) return;
    setReactionBusy(true);
    try {
      const data = await blogApi.togglePublishedLike(token, blogId);
      setBlog((prev) => prev ? { ...prev, likeCount: data.likeCount, liked: data.liked, dislikeCount: data.dislikeCount, disliked: data.disliked } : prev);
    } catch (err) {
      setReactionHint(err.message || 'Like did not go through.');
    } finally {
      setReactionBusy(false);
    }
  };

  const onDislike = async () => {
    setReactionHint('');
    if (!token) { setReactionHint('Sign in to react to posts.'); return; }
    if (ownPost) return;
    setReactionBusy(true);
    try {
      const data = await blogApi.togglePublishedDislike(token, blogId);
      setBlog((prev) => prev ? { ...prev, likeCount: data.likeCount, liked: data.liked, dislikeCount: data.dislikeCount, disliked: data.disliked } : prev);
    } catch (err) {
      setReactionHint(err.message || 'Dislike did not go through.');
    } finally {
      setReactionBusy(false);
    }
  };

  if (loading) {
    return (
      <main className="page-content blog-page">
        <div className="home-published-empty">
          <div className="loading-spinner" />
          <p>Loading post…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page-content blog-page">
        <section className="blog-empty-state"><p>{error}</p></section>
      </main>
    );
  }

  return (
    <main className="blog-detail-page">
      {/* Cover image */}
      {blog?.thumbnailUrl && (
        <div className="blog-detail-cover">
          <img src={blog.thumbnailUrl} alt={blog.title} />
        </div>
      )}

      <div className="page-content blog-page">
        {/* Header */}
        <section className="blog-detail-header">
          <div>
            <h1>{blog?.title || 'Published Blog'}</h1>
            <div className="blog-detail-byline">
              <span className="detail-author-avatar">
                {(blog?.author?.fullName || 'U')[0].toUpperCase()}
              </span>
              <div>
                <span className="detail-author-name">{blog?.author?.fullName || 'Unknown Author'}</span>
                <div className="detail-meta-row">
                  <span>{formattedDate}</span>
                  {blog && <><span className="meta-dot">·</span><span>{estimateReadTime(blog)} min read</span></>}
                  {blog?.viewCount > 0 && <><span className="meta-dot">·</span><span>{blog.viewCount.toLocaleString()} {blog.viewCount === 1 ? 'view' : 'views'}</span></>}
                </div>
              </div>
            </div>
          </div>
          <div className="blog-detail-actions">
            <Link to="/" className="btn-link">← Back to Home</Link>
          </div>
        </section>

        {/* Tags */}
        {blog?.tags?.length > 0 && (
          <div className="blog-detail-tags">
            {blog.tags.map((tag) => (
              <span key={tag} className="tag-chip">{tag}</span>
            ))}
          </div>
        )}

        {/* Reaction bar */}
        <section className="blog-like-bar">
          {ownPost ? (
            <span className="blog-like-note">Your post</span>
          ) : (
            <div className="blog-reaction-row">
              <button
                type="button"
                className={blog?.liked ? 'blog-like-btn on' : 'blog-like-btn'}
                disabled={reactionBusy}
                onClick={onLike}
              >
                {blog?.liked ? '♥ Liked' : '♡ Like'} · {blog?.likeCount ?? 0}
              </button>
              <button
                type="button"
                className={blog?.disliked ? 'blog-dislike-btn on' : 'blog-dislike-btn'}
                disabled={reactionBusy}
                onClick={onDislike}
              >
                {blog?.disliked ? '👎 Disliked' : '👎 Dislike'} · {blog?.dislikeCount ?? 0}
              </button>
            </div>
          )}
          {reactionHint && <p className="blog-like-hint">{reactionHint}</p>}
        </section>

        {/* Summary */}
        {blog?.summary && (
          <section className="editor-card blog-detail-summary">
            <p>{blog.summary}</p>
          </section>
        )}

        {/* Content */}
        <section
          className="blog-rendered-content"
          dangerouslySetInnerHTML={{ __html: blog?.contentHtml || '<p>No content provided.</p>' }}
        />
      </div>
    </main>
  );
}

export default PublicBlogDetails;
