import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { blogApi } from '../utils/blogApi';

const emptyDelta = { ops: [] };

const UploadIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="editor-spinner-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

function BlogEditor() {
  const { blogId } = useParams();
  const isEditMode = Boolean(blogId);
  const { token } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [contentDelta, setContentDelta] = useState(emptyDelta);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote', 'code-block'],
        ['link'],
        [{ align: [] }],
        ['clean'],
      ],
    }),
    []
  );

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const data = await blogApi.getById(token, blogId);
        setTitle(data.blog.title || '');
        setSummary(data.blog.summary || '');
        setThumbnailUrl(data.blog.thumbnailUrl || '');
        setTags(data.blog.tags || []);
        setContentHtml(data.blog.contentHtml || '');
        setContentDelta(data.blog.contentDelta || emptyDelta);
      } catch (err) {
        setError(err.message || 'Failed to load blog for editing');
      } finally {
        setLoading(false);
      }
    };

    if (isEditMode && token) fetchBlog();
  }, [token, blogId, isEditMode]);

  const handleImageFile = useCallback(async (file) => {
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const data = await blogApi.uploadImage(token, file);
      setThumbnailUrl(data.url);
    } catch (err) {
      setUploadError(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  }, [token]);

  const handleFileInputChange = (e) => handleImageFile(e.target.files?.[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleImageFile(e.dataTransfer.files?.[0]);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);

  const removeThumbnail = () => {
    setThumbnailUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addTag = () => {
    const value = tagInput.trim().toLowerCase();
    if (!value || tags.includes(value) || tags.length >= 5) return;
    setTags((prev) => [...prev, value]);
    setTagInput('');
  };

  const removeTag = (tag) => setTags((prev) => prev.filter((t) => t !== tag));

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const buildPayload = (status) => ({ title, summary, thumbnailUrl, tags, contentHtml, contentDelta, status });

  const validateBeforeSave = () => {
    if (!title.trim()) { setError('Title is required.'); return false; }
    if (!contentDelta?.ops || contentDelta.ops.length === 0) {
      setError('Write some content before saving.');
      return false;
    }
    return true;
  };

  const savePost = async (status) => {
    if (!validateBeforeSave()) return;
    setSaving(true);
    setError('');
    try {
      if (isEditMode) {
        await blogApi.update(token, blogId, buildPayload(status));
        navigate(`/blogs/${blogId}`);
      } else {
        const data = await blogApi.create(token, buildPayload(status));
        navigate(`/blogs/${data.blog.id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to save blog');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="page-content blog-page">
        <div className="editor-loading">
          <div className="loading-spinner" />
          <p>Loading editor…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-content blog-page">
      {/* Header */}
      <header className="editor-page-header">
        <div className="editor-page-header-left">
          <Link to="/blogs" className="editor-back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            My Posts
          </Link>
          <div>
            <h1 className="editor-page-title">{isEditMode ? 'Edit Post' : 'New Post'}</h1>
            <p className="editor-page-sub">Save as a draft anytime, publish when ready.</p>
          </div>
        </div>
        <div className="editor-page-header-right">
          <button
            className={`editor-toggle-btn${showPreview ? ' active' : ''}`}
            onClick={() => setShowPreview((p) => !p)}
          >
            {showPreview ? 'Back to Editor' : 'Preview'}
          </button>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      {!showPreview ? (
        <div className="editor-layout">
          {/* ── Main column ── */}
          <section className="editor-main-col">
            <div className="editor-field-card">
              <input
                id="blog-title"
                type="text"
                className="editor-title-input"
                placeholder="Post title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="editor-field-divider" />
              <textarea
                id="blog-summary"
                className="editor-summary-input"
                rows={3}
                placeholder="Write a short summary — shown on cards and search results"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>

            <div className="editor-quill-card">
              <div className="editor-quill-label">Content</div>
              <div className="editor-quill-wrap">
                <ReactQuill
                  theme="snow"
                  value={contentHtml}
                  onChange={(html, _delta, _source, editor) => {
                    setContentHtml(html);
                    setContentDelta(editor.getContents());
                  }}
                  modules={modules}
                  placeholder="Start writing your story…"
                />
              </div>
            </div>
          </section>

          {/* ── Sidebar ── */}
          <aside className="editor-sidebar">
            {/* Publish */}
            <div className="editor-sidebar-card">
              <p className="editor-sidebar-label">Publish</p>
              <button
                className="editor-publish-btn"
                onClick={() => savePost('published')}
                disabled={saving || uploading}
              >
                {saving ? 'Publishing…' : 'Publish'}
              </button>
              <button
                className="editor-draft-btn"
                onClick={() => savePost('draft')}
                disabled={saving || uploading}
              >
                {saving ? 'Saving…' : 'Save Draft'}
              </button>
            </div>

            {/* Cover image */}
            <div className="editor-sidebar-card">
              <p className="editor-sidebar-label">Cover Image</p>
              {thumbnailUrl ? (
                <div className="cover-preview-wrap">
                  <img src={thumbnailUrl} alt="Cover" className="cover-preview-img" />
                  <div className="cover-preview-actions">
                    <button type="button" className="cover-action-btn" onClick={() => fileInputRef.current?.click()}>
                      Change
                    </button>
                    <button type="button" className="cover-action-btn danger" onClick={removeThumbnail}>
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`cover-drop-zone${isDragOver ? ' drag-over' : ''}${uploading ? ' uploading' : ''}`}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                  aria-label="Upload cover image"
                >
                  {uploading ? (
                    <SpinnerIcon />
                  ) : (
                    <>
                      <span className="cover-drop-icon-wrap"><UploadIcon /></span>
                      <span className="cover-drop-label">Click or drag to upload</span>
                      <span className="cover-drop-hint">JPEG · PNG · WebP · Max 5 MB</span>
                    </>
                  )}
                </div>
              )}
              {uploadError && <p className="cover-upload-error">{uploadError}</p>}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="visually-hidden"
                onChange={handleFileInputChange}
              />
            </div>

            {/* Tags */}
            <div className="editor-sidebar-card">
              <p className="editor-sidebar-label">
                Tags
                <span className="editor-sidebar-hint">up to 5</span>
              </p>
              <div className="tag-input-wrap">
                {tags.map((tag) => (
                  <span key={tag} className="tag-chip editor-tag">
                    {tag}
                    <button
                      type="button"
                      className="tag-remove"
                      onClick={() => removeTag(tag)}
                      aria-label={`Remove ${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {tags.length < 5 && (
                  <input
                    type="text"
                    className="tag-text-input"
                    placeholder={tags.length === 0 ? 'e.g. react, tutorial' : 'Add tag…'}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={addTag}
                  />
                )}
              </div>
              <p className="tag-hint">Press Enter or comma to add</p>
            </div>
          </aside>
        </div>
      ) : (
        /* ── Preview ── */
        <section className="editor-preview-wrap">
          <article className="preview-wrapper">
            {thumbnailUrl && (
              <img
                className="preview-thumbnail"
                src={thumbnailUrl}
                alt="Cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <h2 className="preview-title">{title || 'Untitled Post'}</h2>
            {tags.length > 0 && (
              <div className="preview-tags">
                {tags.map((t) => <span key={t} className="tag-chip">{t}</span>)}
              </div>
            )}
            {summary && <p className="preview-summary">{summary}</p>}
            <div
              className="blog-rendered-content"
              dangerouslySetInnerHTML={{ __html: contentHtml || '<p class="editor-placeholder">No content yet.</p>' }}
            />
          </article>
          <div className="preview-footer-actions">
            <button className="editor-draft-btn" onClick={() => savePost('draft')} disabled={saving}>
              {saving ? 'Saving…' : 'Save Draft'}
            </button>
            <button className="editor-publish-btn" onClick={() => savePost('published')} disabled={saving}>
              {saving ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

export default BlogEditor;
