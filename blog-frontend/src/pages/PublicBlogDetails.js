import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { blogApi } from '../utils/blogApi';
import { useAuth } from '../context/AuthContext';
import './BlogPages.css';

function PublicBlogDetails() {
  const { blogId } = useParams();
  const { token, user } = useAuth();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [likeBusy, setLikeBusy] = useState(false);
  const [likeHint, setLikeHint] = useState('');

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

  const formattedDate = blog?.publishedAt ? new Date(blog.publishedAt).toLocaleString() : 'Unknown publish date';

  const ownPost = user && blog?.author?.id && String(blog.author.id) === String(user.id);

  const onLike = async () => {
    setLikeHint('');
    if (!token) {
      setLikeHint('Sign in to like posts.');
      return;
    }
    if (ownPost) return;

    setLikeBusy(true);
    try {
      const data = await blogApi.togglePublishedLike(token, blogId);
      setBlog((prev) =>
        prev ? { ...prev, likeCount: data.likeCount, liked: data.liked } : prev
      );
    } catch (err) {
      setLikeHint(err.message || 'Like did not go through.');
    } finally {
      setLikeBusy(false);
    }
  };

  return (
    <main className="page-content blog-page">
      <section className="blog-detail-header">
        <div>
          <h1>{blog?.title || 'Published Blog'}</h1>
          <p>
            {blog?.author?.fullName ? `By ${blog.author.fullName}` : 'By Unknown Author'} · {formattedDate}
          </p>
        </div>
        <div className="blog-detail-actions">
          <Link to="/" className="btn-link">Back to Home</Link>
        </div>
      </section>

      {loading && (
        <section className="blog-empty-state">
          <p>Loading blog details...</p>
        </section>
      )}

      {error && (
        <section className="blog-empty-state">
          <p>{error}</p>
        </section>
      )}

      {!loading && !error && blog && (
        <>
          <section className="blog-like-bar">
            {ownPost ? (
              <span className="blog-like-note">Your post</span>
            ) : (
              <button
                type="button"
                className={blog.liked ? 'blog-like-btn on' : 'blog-like-btn'}
                disabled={likeBusy}
                onClick={onLike}
              >
                {blog.liked ? '♥ Liked' : '♡ Like'} · {blog.likeCount ?? 0}
              </button>
            )}
            {likeHint && <p className="blog-like-hint">{likeHint}</p>}
          </section>

          <section className="editor-card">
            <h2>Summary</h2>
            <p>{blog.summary || 'No summary provided.'}</p>
          </section>

          <section
            className="blog-rendered-content"
            dangerouslySetInnerHTML={{ __html: blog.contentHtml || '<p>No content provided.</p>' }}
          />
        </>
      )}
    </main>
  );
}

export default PublicBlogDetails;
