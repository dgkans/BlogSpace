import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { blogApi } from '../utils/blogApi';
import './BlogPages.css';

function BlogDetails() {
  const { blogId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const data = await blogApi.getById(token, blogId);
        setBlog(data.blog);
      } catch (err) {
        setError(err.message || 'Failed to load blog');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchBlog();
    }
  }, [token, blogId]);

  const handleDelete = async () => {
    const shouldDelete = window.confirm('Delete this blog post?');
    if (!shouldDelete) {
      return;
    }

    try {
      await blogApi.remove(token, blogId);
      navigate('/blogs');
    } catch (err) {
      setError(err.message || 'Failed to delete blog');
    }
  };

  if (loading) {
    return <main className="page-content"><div className="loading">Loading blog...</div></main>;
  }

  if (error) {
    return <main className="page-content"><div className="error-message">{error}</div></main>;
  }

  if (!blog) {
    return <main className="page-content"><div className="error-message">Blog not found.</div></main>;
  }

  return (
    <main className="page-content blog-page">
      <section className="blog-detail-header">
        <div>
          <span className={`status-badge status-${blog.status}`}>{blog.status}</span>
          <h1>{blog.title}</h1>
          <p>{blog.summary}</p>
          {blog.status === 'published' && blog.publishedAt && (
            <small>Published on {new Date(blog.publishedAt).toLocaleString()}</small>
          )}
        </div>
        <div className="blog-detail-actions">
          <Link to={`/blogs/${blog.id}/edit`} className="btn-primary">Edit</Link>
          <button className="btn-danger" onClick={handleDelete}>Delete</button>
        </div>
      </section>

      <article className="blog-rendered-content" dangerouslySetInnerHTML={{ __html: blog.contentHtml }} />
    </main>
  );
}

export default BlogDetails;
