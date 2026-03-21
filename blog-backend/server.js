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

// Connect to MongoDB
await connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

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
    const lastUserWithId = await User.findOne({ id: { $ne: null } })
      .sort({ id: -1 })
      .select('id');
    const nextId = lastUserWithId?.id ? lastUserWithId.id + 1 : 1;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      id: nextId,
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
  const { title, content, status } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  try {
    const blog = await Blog.create({
      author_id: req.user.userId,
      title,
      content,
      status: status || 'draft',
    });

    res.status(201).json({
      message: 'Blog created successfully',
      blog: {
        id: blog._id,
        title: blog.title,
        content: blog.content,
        status: blog.status,
        author_id: blog.author_id,
        created_at: blog.created_at,
        updated_at: blog.updated_at,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error creating blog' });
  }
});

app.put('/api/blogs/:blogId/publish', verifyToken, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    if (blog.author_id.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    blog.status = 'published';
    await blog.save();

    res.json({
      message: 'Blog published',
      blog: {
        id: blog._id,
        title: blog.title,
        content: blog.content,
        status: blog.status,
        author_id: blog.author_id,
        created_at: blog.created_at,
        updated_at: blog.updated_at,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error publishing blog' });
  }
});

app.get('/api/blogs/published', async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'published' })
      .sort({ created_at: -1 })
      .limit(20)
      .populate('author_id', 'full_name username');

    res.json({
      blogs: blogs.map((b) => ({
        id: b._id,
        title: b.title,
        content: b.content,
        status: b.status,
        author: b.author_id
          ? { id: b.author_id._id, full_name: b.author_id.full_name, username: b.author_id.username }
          : null,
        created_at: b.created_at,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching published blogs' });
  }
});

app.get('/api/blogs/public/:blogId', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId).populate('author_id', 'full_name username');
    if (!blog || blog.status !== 'published') {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.json({
      blog: {
        id: blog._id,
        title: blog.title,
        content: blog.content,
        status: blog.status,
        author: blog.author_id
          ? { id: blog.author_id._id, full_name: blog.author_id.full_name, username: blog.author_id.username }
          : null,
        created_at: blog.created_at,
        updated_at: blog.updated_at,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching blog' });
  }
});

app.get('/api/blogs/mine', verifyToken, async (req, res) => {
  try {
    const blogs = await Blog.find({ author_id: req.user.userId })
      .sort({ created_at: -1 })
      .limit(50);

    res.json({
      blogs: blogs.map((b) => ({
        id: b._id,
        title: b.title,
        content: b.content,
        status: b.status,
        created_at: b.created_at,
        updated_at: b.updated_at,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching your blogs' });
  }
});

app.get('/api/blogs/:blogId', verifyToken, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    if (blog.author_id.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json({
      blog: {
        id: blog._id,
        title: blog.title,
        content: blog.content,
        status: blog.status,
        created_at: blog.created_at,
        updated_at: blog.updated_at,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching blog' });
  }
});

app.put('/api/blogs/:blogId', verifyToken, async (req, res) => {
  const { title, content, status } = req.body;

  try {
    const blog = await Blog.findById(req.params.blogId);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    if (blog.author_id.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updates = {};

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ message: 'Title cannot be empty' });
      }
      updates.title = title.trim();
    }

    if (content !== undefined) {
      if (!content.trim()) {
        return res.status(400).json({ message: 'Content cannot be empty' });
      }
      updates.content = content;
    }

    if (status !== undefined) {
      const allowed = ['draft', 'published', 'archived'];
      if (!allowed.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      updates.status = status;
    }

    await Blog.findByIdAndUpdate(req.params.blogId, { $set: updates }, { new: true });

    const updated = await Blog.findById(req.params.blogId);
    res.json({
      message: 'Blog updated successfully',
      blog: {
        id: updated._id,
        title: updated.title,
        content: updated.content,
        status: updated.status,
        created_at: updated.created_at,
        updated_at: updated.updated_at,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error updating blog' });
  }
});

app.delete('/api/blogs/:blogId', verifyToken, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    if (blog.author_id.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Blog.findByIdAndDelete(req.params.blogId);

    res.json({ message: 'Blog deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error deleting blog' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
