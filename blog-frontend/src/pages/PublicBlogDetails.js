import React, { useEffect, useRef, useState } from 'react';
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
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [reactionHint, setReactionHint] = useState('');
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState('');
  const [editingCommentId, setEditingCommentId] = useState('');
  const [editingText, setEditingText] = useState('');
  const [editingBusy, setEditingBusy] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');
  const copyResetRef = useRef(null);

  useEffect(() => {
    return () => {
      if (copyResetRef.current) clearTimeout(copyResetRef.current);
    };
  }, []);

  useEffect(() => {
    const loadBlogAndComments = async () => {
      setLoading(true);
      setCommentsLoading(true);
      setError('');
      setCommentsError('');
      try {
        const blogData = await blogApi.getPublishedById(blogId, token);
        setBlog(blogData.blog);
      } catch (err) {
        setError(err.message || 'Failed to load blog details');
      } finally {
        setLoading(false);
      }

      try {
        const commentsData = await blogApi.listComments(blogId);
        setComments(commentsData.comments || []);
      } catch (err) {
        setCommentsError(err.message || 'Could not load comments right now.');
      } finally {
        setCommentsLoading(false);
      }
    };
    loadBlogAndComments();
  }, [blogId, token]);

  const formattedDate = blog?.publishedAt
    ? new Date(blog.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown publish date';

  const ownPost = user && blog?.author?.id && String(blog.author.id) === String(user.id);
  const canManageComment = (comment) =>
    !!user && (String(comment.author?.id) === String(user.id) || ownPost);

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

  const onBookmark = async () => {
    setReactionHint('');
    if (!token) {
      setReactionHint('Sign in to save posts.');
      return;
    }
    setBookmarkBusy(true);
    try {
      const data = await blogApi.togglePublishedBookmark(token, blogId);
      setBlog((prev) => (prev ? { ...prev, bookmarked: data.bookmarked } : prev));
    } catch (err) {
      setReactionHint(err.message || 'Bookmark did not update.');
    } finally {
      setBookmarkBusy(false);
    }
  };

  const onAddComment = async (event) => {
    event.preventDefault();
    const content = commentText.trim();
    setCommentsError('');
    if (!token) {
      setCommentsError('Sign in to leave a comment.');
      return;
    }
    if (!content) {
      setCommentsError('Comment cannot be empty.');
      return;
    }
    setCommentBusy(true);
    try {
      const data = await blogApi.addComment(token, blogId, content);
      setComments((prev) => [data.comment, ...prev]);
      setCommentText('');
    } catch (err) {
      setCommentsError(err.message || 'Could not post comment.');
    } finally {
      setCommentBusy(false);
    }
  };

  const onDeleteComment = async (commentId) => {
    if (!token) return;
    setCommentsError('');
    setDeletingCommentId(commentId);
    try {
      await blogApi.removeComment(token, blogId, commentId);
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    } catch (err) {
      setCommentsError(err.message || 'Could not delete comment.');
    } finally {
      setDeletingCommentId('');
    }
  };

  const onStartEditComment = (comment) => {
    setCommentsError('');
    setEditingCommentId(comment.id);
    setEditingText(comment.content || '');
  };

  const onCancelEditComment = () => {
    setEditingCommentId('');
    setEditingText('');
    setEditingBusy(false);
  };

  const onSaveEditComment = async (commentId) => {
    if (!token) return;
    const content = editingText.trim();
    if (!content) {
      setCommentsError('Comment cannot be empty.');
      return;
    }

    setCommentsError('');
    setEditingBusy(true);
    try {
      const data = await blogApi.updateComment(token, blogId, commentId, content);
      setComments((prev) =>
        prev.map((comment) => (comment.id === commentId ? data.comment : comment))
      );
      onCancelEditComment();
    } catch (err) {
      setCommentsError(err.message || 'Could not update comment.');
      setEditingBusy(false);
    }
  };

  const formatCommentDate = (value) =>
    new Date(value).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  const isEditedComment = (comment) => {
    if (!comment?.createdAt || !comment?.updatedAt) return false;
    return new Date(comment.updatedAt).getTime() > new Date(comment.createdAt).getTime();
  };

  const postPublicUrl = `${window.location.origin}/blogs/public/${blogId}`;

  const copyPostUrl = async () => {
    if (copyResetRef.current) clearTimeout(copyResetRef.current);
    const write = async () => {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(postPublicUrl);
        return;
      }
      const ta = document.createElement('textarea');
      ta.value = postPublicUrl;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      if (!ok) throw new Error('copy failed');
    };
    try {
      await write();
      setCopyFeedback('Copied!');
    } catch {
      setCopyFeedback('Could not copy');
    }
    copyResetRef.current = setTimeout(() => setCopyFeedback(''), 2200);
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
            <button
              type="button"
              className="btn-copy-post-url"
              onClick={copyPostUrl}
              aria-label="Copy link to this post"
            >
              {copyFeedback || 'Copy link'}
            </button>
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
          <div className="blog-reaction-row blog-reaction-row-with-bookmark">
            {ownPost ? (
              <span className="blog-like-note">Your post</span>
            ) : (
              <>
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
              </>
            )}
            <button
              type="button"
              className={blog?.bookmarked ? 'blog-bookmark-btn on' : 'blog-bookmark-btn'}
              disabled={bookmarkBusy}
              onClick={onBookmark}
              title={blog?.bookmarked ? 'Remove from saved' : 'Save post'}
            >
              {blog?.bookmarked ? '★ Saved' : '☆ Save'}
            </button>
          </div>
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

        <section className="blog-comments-card">
          <div className="blog-comments-head">
            <h2>Comments</h2>
            <span>{comments.length}</span>
          </div>

          <form className="blog-comment-form" onSubmit={onAddComment}>
            <textarea
              rows={3}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={token ? 'Share your thoughts…' : 'Sign in to leave a comment'}
              disabled={!token || commentBusy}
              maxLength={1200}
            />
            <div className="blog-comment-form-row">
              <small>{commentText.trim().length}/1200</small>
              <button type="submit" className="btn-primary" disabled={!token || commentBusy}>
                {commentBusy ? 'Posting…' : 'Post comment'}
              </button>
            </div>
          </form>

          {commentsError && <p className="blog-comment-error">{commentsError}</p>}

          {commentsLoading ? (
            <p className="muted">Loading comments…</p>
          ) : comments.length === 0 ? (
            <p className="muted">No comments yet. Start the conversation.</p>
          ) : (
            <ul className="blog-comment-list">
              {comments.map((comment) => (
                <li key={comment.id} className="blog-comment-item">
                  <div className="blog-comment-meta">
                    <strong>{comment.author?.fullName || 'Unknown User'}</strong>
                    <span>
                      {formatCommentDate(comment.createdAt)}
                      {isEditedComment(comment) && <em className="blog-comment-edited"> (edited)</em>}
                    </span>
                  </div>
                  {editingCommentId === comment.id ? (
                    <div className="blog-comment-edit-wrap">
                      <textarea
                        rows={3}
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        maxLength={1200}
                        disabled={editingBusy}
                      />
                      <div className="blog-comment-edit-actions">
                        <small>{editingText.trim().length}/1200</small>
                        <div>
                          <button
                            type="button"
                            className="blog-comment-action"
                            onClick={onCancelEditComment}
                            disabled={editingBusy}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="blog-comment-action save"
                            onClick={() => onSaveEditComment(comment.id)}
                            disabled={editingBusy}
                          >
                            {editingBusy ? 'Saving…' : 'Save'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p>{comment.content}</p>
                  )}

                  {canManageComment(comment) && editingCommentId !== comment.id && (
                    <div className="blog-comment-tools">
                      <button
                        type="button"
                        className="blog-comment-action"
                        onClick={() => onStartEditComment(comment)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="blog-comment-action delete"
                        disabled={deletingCommentId === comment.id}
                        onClick={() => onDeleteComment(comment.id)}
                      >
                        {deletingCommentId === comment.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

export default PublicBlogDetails;
