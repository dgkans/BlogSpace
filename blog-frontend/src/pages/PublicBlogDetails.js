import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { blogApi } from '../utils/blogApi';
import './BlogPages.css';

function PublicBlogDetails() {
  const { blogId } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadBlog = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await blogApi.getPublishedById(blogId);
        setBlog(data.blog);
      } catch (err) {
        setError(err.message || 'Failed to load blog details');
      } finally {
        setLoading(false);
      }
    };

    loadBlog();
  }, [blogId]);

  const formattedDate = blog?.publishedAt ? new Date(blog.publishedAt).toLocaleString() : 'Unknown publish date';

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
