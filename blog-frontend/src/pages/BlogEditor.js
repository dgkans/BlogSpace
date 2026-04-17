import React, { useEffect, useMemo, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { blogApi } from '../utils/blogApi';
import './BlogPages.css';

const emptyDelta = { ops: [] };

function BlogEditor() {
  const { blogId } = useParams();
  const isEditMode = Boolean(blogId);
  const { token } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [contentDelta, setContentDelta] = useState(emptyDelta);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote', 'code-block'],
        ['link', 'image'],
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
        setContentHtml(data.blog.contentHtml || '');
        setContentDelta(data.blog.contentDelta || emptyDelta);
      } catch (err) {
        setError(err.message || 'Failed to load blog for editing');
      } finally {
        setLoading(false);
      }
    };

    if (isEditMode && token) {
      fetchBlog();
    }
  }, [token, blogId, isEditMode]);

  const buildPayload = (status) => ({
    title,
    summary,
    contentHtml,
    contentDelta,
    status,
  });

  const validateBeforeSave = () => {
    if (!title.trim()) {
      setError('Title is required.');
      return false;
    }

    if (!contentDelta?.ops || contentDelta.ops.length === 0) {
      setError('Write some content before saving.');
      return false;
    }

    return true;
  };

  const savePost = async (status) => {
    if (!validateBeforeSave()) {
      return;
    }

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
    return <main className="page-content"><div className="loading">Loading editor...</div></main>;
  }

  return (
    <main className="page-content blog-page">
      <section className="blog-editor-header">
        <div>
          <h1>{isEditMode ? 'Edit Blog Post' : 'Create Blog Post'}</h1>
          <p>Save as draft any time, then preview and publish when you are ready.</p>
        </div>
        <div className="editor-header-actions">
          <Link to="/blogs" className="btn-link">Back to Posts</Link>
          <button className="btn-primary" onClick={() => setShowPreview((prev) => !prev)}>
            {showPreview ? 'Back to Editor' : 'Preview'}
          </button>
        </div>
      </section>

      {error && <div className="error-message">{error}</div>}

      <section className="editor-card">
        <div className="form-group">
          <label htmlFor="blog-title">Title</label>
          <input
            id="blog-title"
            type="text"
            placeholder="Enter post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="blog-summary">Summary</label>
          <input
            id="blog-summary"
            type="text"
            placeholder="Optional short summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </div>

        {!showPreview ? (
          <div className="editor-wrapper">
            <ReactQuill
              theme="snow"
              value={contentHtml}
              onChange={(html, _delta, _source, editor) => {
                setContentHtml(html);
                setContentDelta(editor.getContents());
              }}
              modules={modules}
            />
          </div>
        ) : (
          <article className="preview-wrapper">
            <h2>{title || 'Untitled Post'}</h2>
            {summary && <p className="preview-summary">{summary}</p>}
            <div className="blog-rendered-content" dangerouslySetInnerHTML={{ __html: contentHtml }} />
          </article>
        )}

        <div className="editor-actions">
          <button className="btn-primary" onClick={() => savePost('draft')} disabled={saving}>
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button className="btn-submit" onClick={() => savePost('published')} disabled={saving}>
            {saving ? 'Saving...' : 'Publish'}
          </button>
        </div>
      </section>
    </main>
  );
}

export default BlogEditor;
