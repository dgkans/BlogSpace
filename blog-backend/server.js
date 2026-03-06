import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory user store (for demo purposes)
const users = new Map();

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Blog Backend API' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Signup endpoint
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (users.has(username)) {
    return res.status(409).json({ error: 'User already exists' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    users.set(username, hashedPassword);
    return res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Error creating user' });
  }
});

// Signin endpoint
app.post('/api/signin', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const storedHash = users.get(username);
  if (!storedHash) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  try {
    const match = await bcrypt.compare(password, storedHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { username },
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: '1h' }
    );

    return res.json({ token });
  } catch (err) {
    return res.status(500).json({ error: 'Error signing in' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
