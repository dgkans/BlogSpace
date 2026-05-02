import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import connectDB from './config/db.js';
import User from './models/User.js';
import Blog from './models/Blog.js';
import BlogLike from './models/BlogLike.js';
import BlogDislike from './models/BlogDislike.js';
import BlogComment from './models/BlogComment.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const REQUEST_BODY_LIMIT = process.env.REQUEST_BODY_LIMIT || '10mb';

// Connect to MongoDB
await connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: REQUEST_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: REQUEST_BODY_LIMIT }));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)) return cb(null, true);
    cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'));
  },
});

const BLOG_STATUSES = ['draft', 'published'];

const sanitizeBlogPayload = (body = {}) => {
  const title = (body.title || '').trim();
  const summary = (body.summary || '').trim();
  const contentHtml = (body.contentHtml || '').trim();
  const contentDelta = body.contentDelta;
  const status = BLOG_STATUSES.includes(body.status) ? body.status : 'draft';
  const thumbnailUrl = (body.thumbnailUrl || '').trim();
  const tags = Array.isArray(body.tags)
    ? body.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 5)
    : [];

  return { title, summary, contentHtml, contentDelta, status, thumbnailUrl, tags };
};

const formatBlog = (blog) => ({
  id: blog._id,
  authorId: blog.author,
  title: blog.title,
  summary: blog.summary,
  contentDelta: blog.content_delta,
  contentHtml: blog.content_html,
  thumbnailUrl: blog.thumbnail_url,
  tags: blog.tags ?? [],
  status: blog.status,
  publishedAt: blog.published_at,
  createdAt: blog.created_at,
  updatedAt: blog.updated_at,
});

const formatPublicBlog = (blog) => ({
  id: blog._id,
  title: blog.title,
  summary: blog.summary,
  contentHtml: blog.content_html,
  thumbnailUrl: blog.thumbnail_url,
  tags: blog.tags ?? [],
  viewCount: blog.view_count ?? 0,
  status: blog.status,
  publishedAt: blog.published_at,
  createdAt: blog.created_at,
  updatedAt: blog.updated_at,
  author: {
    id: blog.author?._id,
    fullName: blog.author?.full_name || 'Unknown Author',
  },
});

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
  } catch {
    req.user = null;
  }
  next();
};

const likeCountsForBlogs = async (blogIds) => {
  if (!blogIds.length) return new Map();
  const rows = await BlogLike.aggregate([
    { $match: { blog: { $in: blogIds } } },
    { $group: { _id: '$blog', likeCount: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.likeCount]));
};

const dislikeCountsForBlogs = async (blogIds) => {
  if (!blogIds.length) return new Map();
  const rows = await BlogDislike.aggregate([
    { $match: { blog: { $in: blogIds } } },
    { $group: { _id: '$blog', dislikeCount: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.dislikeCount]));
};

const likedBlogIdsForUser = async (blogIds, userId) => {
  if (!blogIds.length || !userId) return new Set();
  const rows = await BlogLike.find({ blog: { $in: blogIds }, user: userId })
    .select('blog')
    .lean();
  return new Set(rows.map((r) => String(r.blog)));
};

const dislikedBlogIdsForUser = async (blogIds, userId) => {
  if (!blogIds.length || !userId) return new Set();
  const rows = await BlogDislike.find({ blog: { $in: blogIds }, user: userId })
    .select('blog')
    .lean();
  return new Set(rows.map((r) => String(r.blog)));
};

const publicBlogJson = (doc, likeCount, liked, dislikeCount, disliked) => ({
  ...formatPublicBlog(doc),
  likeCount,
  liked,
  dislikeCount,
  disliked,
});

const formatComment = (comment) => ({
  id: comment._id,
  blogId: comment.blog,
  content: comment.content,
  createdAt: comment.created_at,
  updatedAt: comment.updated_at,
  author: {
    id: comment.user?._id,
    fullName: comment.user?.full_name || 'Unknown User',
  },
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Blog Backend API' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Register Route
app.post('/api/auth/register', async (req, res) => {
  const { fullName, email, password } = req.body;
  
  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const lastUserWithId = await User.findOne({ id: { $ne: null } })
      .sort({ id: -1 })
      .select('id');
    const nextId = lastUserWithId?.id ? lastUserWithId.id + 1 : 1;

    const baseUsername = (email.split('@')[0] || 'user').replace(/[^a-zA-Z0-9_]/g, '') || 'user';
    let username = baseUsername;
    let suffix = 0;
    while (await User.findOne({ username })) {
      suffix += 1;
      username = `${baseUsername}_${suffix}`;
    }

    // Create new user (numeric id required for unique index on users.id)
    const user = new User({
      id: nextId,
      full_name: fullName,
      email,
      username,
      hashed_password: hashedPassword,
      is_active: true,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        fullName: user.full_name,
        email: user.email
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error registering user' });
  }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.hashed_password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.full_name,
        email: user.email
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error logging in' });
  }
});

// Get current user (protected route)
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      user: {
        id: user._id,
        fullName: user.full_name,
        email: user.email
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching user' });
  }
});

// Get user profile by ID (protected route)
app.get('/api/users/:userId', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      user: {
        id: user._id,
        fullName: user.full_name,
        email: user.email,
        username: user.username,
        createdAt: user.created_at
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// Update user profile (protected route)
app.put('/api/users/:userId', verifyToken, async (req, res) => {
  // Users can only update their own profile
  if (req.user.userId !== req.params.userId) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  const { fullName, email } = req.body;

  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if new email is already in use
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: 'Email already in use' });
      }
      user.email = email;
    }

    if (fullName) {
      user.full_name = fullName;
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        fullName: user.full_name,
        email: user.email
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error updating profile' });
  }
});

// Delete user profile (protected route)
app.delete('/api/users/:userId', verifyToken, async (req, res) => {
  // Users can only delete their own profile
  if (req.user.userId !== req.params.userId) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Profile deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error deleting profile' });
  }
});

app.post('/api/upload', verifyToken, imageUpload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No image file provided' });
  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'blog-thumbnails', resource_type: 'image' },
        (err, data) => (err ? reject(err) : resolve(data))
      );
      stream.end(req.file.buffer);
    });
    return res.status(201).json({ url: result.secure_url });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    return res.status(502).json({ message: 'Image upload failed. Check Cloudinary credentials.' });
  }
});

app.get('/api/blogs/public', optionalAuth, async (req, res) => {
  const { q = '', sort = 'newest', period = 'all', tag = '' } = req.query;
  const filter = { status: 'published' };

  const trimmedQuery = String(q).trim();
  if (trimmedQuery) {
    const queryRegex = new RegExp(escapeRegex(trimmedQuery), 'i');
    filter.$or = [
      { title: queryRegex },
      { summary: queryRegex },
      { content_html: queryRegex },
    ];
  }

  const trimmedTag = String(tag).trim().toLowerCase();
  if (trimmedTag) {
    filter.tags = trimmedTag;
  }

  const now = new Date();
  if (period === '7d') {
    filter.published_at = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
  } else if (period === '30d') {
    filter.published_at = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
  } else if (period === '1y') {
    filter.published_at = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
  }

  const sortDirection = sort === 'oldest' ? 1 : -1;
  const viewerId = req.user?.userId || null;

  try {
    const blogs = await Blog.find(filter)
      .populate('author', 'full_name')
      .sort({ published_at: sortDirection, created_at: sortDirection })
      .limit(100);

    const ids = blogs.map((b) => b._id);
    const countMap = await likeCountsForBlogs(ids);
    const dislikeCountMap = await dislikeCountsForBlogs(ids);
    const likedSet = await likedBlogIdsForUser(ids, viewerId);
    const dislikedSet = await dislikedBlogIdsForUser(ids, viewerId);

    const payload = blogs.map((b) =>
      publicBlogJson(
        b,
        countMap.get(String(b._id)) || 0,
        viewerId ? likedSet.has(String(b._id)) : false,
        dislikeCountMap.get(String(b._id)) || 0,
        viewerId ? dislikedSet.has(String(b._id)) : false
      )
    );

    res.json({ blogs: payload });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching published blogs' });
  }
});

app.get('/api/blogs/public/:blogId', optionalAuth, async (req, res) => {
  const viewerId = req.user?.userId || null;

  try {
    const blog = await Blog.findOne({
      _id: req.params.blogId,
      status: 'published',
    }).populate('author', 'full_name');

    if (!blog) {
      return res.status(404).json({ message: 'Published blog not found' });
    }

    await Blog.findByIdAndUpdate(blog._id, { $inc: { view_count: 1 } });

    const likeCount = await BlogLike.countDocuments({ blog: blog._id });
    const dislikeCount = await BlogDislike.countDocuments({ blog: blog._id });
    let liked = false;
    let disliked = false;
    if (viewerId) {
      liked = !!(await BlogLike.findOne({ blog: blog._id, user: viewerId }));
      disliked = !!(await BlogDislike.findOne({ blog: blog._id, user: viewerId }));
    }

    res.json({ blog: publicBlogJson(blog, likeCount, liked, dislikeCount, disliked) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching published blog details' });
  }
});

app.post('/api/blogs/public/:blogId/like', verifyToken, async (req, res) => {
  try {
    const blog = await Blog.findOne({
      _id: req.params.blogId,
      status: 'published',
    });

    if (!blog) {
      return res.status(404).json({ message: 'Published blog not found' });
    }

    if (String(blog.author) === req.user.userId) {
      return res.status(400).json({ message: "You can't like your own blog" });
    }

    const existing = await BlogLike.findOne({
      blog: blog._id,
      user: req.user.userId,
    });

    let liked;
    if (existing) {
      await existing.deleteOne();
      liked = false;
    } else {
      await BlogLike.create({ blog: blog._id, user: req.user.userId });
      await BlogDislike.deleteOne({ blog: blog._id, user: req.user.userId });
      liked = true;
    }

    const likeCount = await BlogLike.countDocuments({ blog: blog._id });
    const dislikeCount = await BlogDislike.countDocuments({ blog: blog._id });
    const disliked = !!(await BlogDislike.findOne({ blog: blog._id, user: req.user.userId }));
    res.json({ liked, likeCount, disliked, dislikeCount });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error updating like' });
  }
});

app.post('/api/blogs/public/:blogId/dislike', verifyToken, async (req, res) => {
  try {
    const blog = await Blog.findOne({
      _id: req.params.blogId,
      status: 'published',
    });

    if (!blog) {
      return res.status(404).json({ message: 'Published blog not found' });
    }

    if (String(blog.author) === req.user.userId) {
      return res.status(400).json({ message: "You can't dislike your own blog" });
    }

    const existing = await BlogDislike.findOne({
      blog: blog._id,
      user: req.user.userId,
    });

    let disliked;
    if (existing) {
      await existing.deleteOne();
      disliked = false;
    } else {
      await BlogDislike.create({ blog: blog._id, user: req.user.userId });
      await BlogLike.deleteOne({ blog: blog._id, user: req.user.userId });
      disliked = true;
    }

    const dislikeCount = await BlogDislike.countDocuments({ blog: blog._id });
    const likeCount = await BlogLike.countDocuments({ blog: blog._id });
    const liked = !!(await BlogLike.findOne({ blog: blog._id, user: req.user.userId }));
    res.json({ disliked, dislikeCount, liked, likeCount });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error updating dislike' });
  }
});

app.get('/api/blogs/public/:blogId/comments', async (req, res) => {
  try {
    const blog = await Blog.findOne({
      _id: req.params.blogId,
      status: 'published',
    }).select('_id');

    if (!blog) {
      return res.status(404).json({ message: 'Published blog not found' });
    }

    const comments = await BlogComment.find({ blog: blog._id })
      .populate('user', 'full_name')
      .sort({ created_at: -1 })
      .limit(200)
      .lean();

    return res.json({ comments: comments.map(formatComment) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching comments' });
  }
});

app.post('/api/blogs/public/:blogId/comments', verifyToken, async (req, res) => {
  const content = String(req.body?.content || '').trim();
  if (!content) {
    return res.status(400).json({ message: 'Comment cannot be empty' });
  }
  if (content.length > 1200) {
    return res.status(400).json({ message: 'Comment is too long (max 1200 characters)' });
  }

  try {
    const blog = await Blog.findOne({
      _id: req.params.blogId,
      status: 'published',
    }).select('_id author');

    if (!blog) {
      return res.status(404).json({ message: 'Published blog not found' });
    }

    const saved = await BlogComment.create({
      blog: blog._id,
      user: req.user.userId,
      content,
    });

    const comment = await BlogComment.findById(saved._id)
      .populate('user', 'full_name')
      .lean();

    return res.status(201).json({ comment: formatComment(comment) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error creating comment' });
  }
});

app.delete('/api/blogs/public/:blogId/comments/:commentId', verifyToken, async (req, res) => {
  try {
    const blog = await Blog.findOne({
      _id: req.params.blogId,
      status: 'published',
    }).select('_id author');

    if (!blog) {
      return res.status(404).json({ message: 'Published blog not found' });
    }

    const comment = await BlogComment.findOne({
      _id: req.params.commentId,
      blog: blog._id,
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const isCommentAuthor = String(comment.user) === req.user.userId;
    const isBlogAuthor = String(blog.author) === req.user.userId;
    if (!isCommentAuthor && !isBlogAuthor) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await comment.deleteOne();
    return res.json({ message: 'Comment deleted successfully', commentId: req.params.commentId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error deleting comment' });
  }
});

app.post('/api/blogs', verifyToken, async (req, res) => {
  const payload = sanitizeBlogPayload(req.body);

  if (!payload.title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  if (!payload.contentDelta || !Array.isArray(payload.contentDelta.ops)) {
    return res.status(400).json({ message: 'Valid rich text content is required' });
  }

  try {
    const blog = new Blog({
      author: req.user.userId,
      title: payload.title,
      summary: payload.summary,
      content_delta: payload.contentDelta,
      content_html: payload.contentHtml,
      thumbnail_url: payload.thumbnailUrl,
      tags: payload.tags,
      status: payload.status,
      published_at: payload.status === 'published' ? new Date() : null,
    });

    await blog.save();
    res.status(201).json({ message: 'Blog created successfully', blog: formatBlog(blog) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error creating blog' });
  }
});

app.get('/api/blogs', verifyToken, async (req, res) => {
  const statusFilter = req.query.status;
  const filter = { author: req.user.userId };

  if (BLOG_STATUSES.includes(statusFilter)) {
    filter.status = statusFilter;
  }

  try {
    const blogs = await Blog.find(filter).sort({ updated_at: -1 });
    res.json({ blogs: blogs.map(formatBlog) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching blogs' });
  }
});

app.get('/api/blogs/:blogId', verifyToken, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    if (String(blog.author) !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json({ blog: formatBlog(blog) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching blog' });
  }
});

app.put('/api/blogs/:blogId', verifyToken, async (req, res) => {
  const payload = sanitizeBlogPayload(req.body);

  if (!payload.title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  if (!payload.contentDelta || !Array.isArray(payload.contentDelta.ops)) {
    return res.status(400).json({ message: 'Valid rich text content is required' });
  }

  try {
    const blog = await Blog.findById(req.params.blogId);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    if (String(blog.author) !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    blog.title = payload.title;
    blog.summary = payload.summary;
    blog.content_delta = payload.contentDelta;
    blog.content_html = payload.contentHtml;
    blog.thumbnail_url = payload.thumbnailUrl;
    blog.tags = payload.tags;

    if (payload.status === 'published' && blog.status !== 'published') {
      blog.published_at = new Date();
    }

    if (payload.status === 'draft') {
      blog.published_at = null;
    }

    blog.status = payload.status;

    await blog.save();
    res.json({ message: 'Blog updated successfully', blog: formatBlog(blog) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error updating blog' });
  }
});

app.post('/api/blogs/:blogId/publish', verifyToken, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    if (String(blog.author) !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    blog.status = 'published';
    blog.published_at = new Date();

    await blog.save();
    res.json({ message: 'Blog published successfully', blog: formatBlog(blog) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error publishing blog' });
  }
});

app.delete('/api/blogs/:blogId', verifyToken, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    if (String(blog.author) !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await BlogLike.deleteMany({ blog: req.params.blogId });
    await BlogDislike.deleteMany({ blog: req.params.blogId });
    await BlogComment.deleteMany({ blog: req.params.blogId });
    await Blog.findByIdAndDelete(req.params.blogId);
    res.json({ message: 'Blog deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error deleting blog' });
  }
});

app.use((err, req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be under 5 MB' : err.message;
    return res.status(400).json({ message: msg });
  }
  if (err?.message?.startsWith('Only')) {
    return res.status(400).json({ message: err.message });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      message: `Payload too large. Max body size: ${REQUEST_BODY_LIMIT}`,
    });
  }
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
