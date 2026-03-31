import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import connectDB from './config/db.js';
import User from './models/User.js';
import Blog from './models/Blog.js';

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

const BLOG_STATUSES = ['draft', 'published'];

const sanitizeBlogPayload = (body = {}) => {
  const title = (body.title || '').trim();
  const summary = (body.summary || '').trim();
  const contentHtml = (body.contentHtml || '').trim();
  const contentDelta = body.contentDelta;
  const status = BLOG_STATUSES.includes(body.status) ? body.status : 'draft';

  return {
    title,
    summary,
    contentHtml,
    contentDelta,
    status,
  };
};

const formatBlog = (blog) => ({
  id: blog._id,
  authorId: blog.author,
  title: blog.title,
  summary: blog.summary,
  contentDelta: blog.content_delta,
  contentHtml: blog.content_html,
  status: blog.status,
  publishedAt: blog.published_at,
  createdAt: blog.created_at,
  updatedAt: blog.updated_at,
});

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

    // Create new user
    const user = new User({
      full_name: fullName,
      email,
      username: email.split('@')[0],
      hashed_password: hashedPassword,
      is_active: true
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
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
      { userId: user._id, email: user.email },
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

    await Blog.findByIdAndDelete(req.params.blogId);
    res.json({ message: 'Blog deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error deleting blog' });
  }
});

app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      message: `Payload too large. Reduce image size or use image hosting. Max body size: ${REQUEST_BODY_LIMIT}`,
    });
  }

  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
