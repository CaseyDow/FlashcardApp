import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import User from './models/User.js';

dotenv.config();

const app = express();
const PORT = 5050;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected!'))
  .catch((err) => console.error(err));

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    const value = rest.join('=');
    cookies[name] = decodeURIComponent(value);
  });

  return cookies;
}

async function authMiddleware(req, res, next) {
  try {
    const { token } = parseCookies(req.headers.cookie);
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Unauthorized' });
  }
};

function authToken(id) {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

app.post('/api/user', async (req, res) => {
  const { username, password } = req.body;
  const { action } = req.query;

  try {
    if (username == null || username == '' || password == null || password == '') {
      return res.status(400).json({ message: 'Please input a username and password' })
    }
    let user = await User.findOne({ username: username });
    if (action == 'signup') {
      if (user) {
        return res.status(400).json({ message: 'User exists' });
      }

      const hash = await bcrypt.hash(password, 10);
      const newUser = await User.create({ username: username, password: hash });

      res.cookie('token', authToken(newUser._id), { httpOnly: true, sameSite: 'strict', secure: false });

      return res.json({ message: 'Signup successful!' });
    } else if (action == 'login') {
      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }
      const correctPassword = await bcrypt.compare(password, user.password);
      if (!correctPassword) {
        return res.status(400).json({ message: 'Incorrect password' });
      }

      res.cookie('token', authToken(user._id), { httpOnly: true, sameSite: 'strict', secure: false });

      return res.json({
        message: 'Login successful',
        data: user.data
      });
    }

    return res.status(400).json({ message:'Unknown action' })
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/private/upload', authMiddleware, async (req, res) => {
  const { data } = req.body;

  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.data = data;
  await user.save();
  console.log(req.body)
  console.log(data)
  res.json({ message: 'Data saved!' });
});

app.get('/api/private/fetch', authMiddleware, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json({ data: user.data });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
