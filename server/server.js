import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import Deck from './models/Deck.js';
import User from './models/User.js';

dotenv.config();

const app = express();
const PORT = 5050;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected!'))
  .catch((err) => console.error(err));

function authToken(id) {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

app.get('/api/user/check', authenticate, (req, res) => {
  res.json({ loggedIn: true });
});

app.post('/api/user/signup', async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ message: 'Please input a username and password' });
    }

    let user = await User.findOne({ username: username });
    if (user) {
      return res.status(400).json({ message: 'User exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username: username, password: hash });

    res.cookie('token', authToken(newUser._id), { httpOnly: true, sameSite: 'strict', secure: false });

    res.json({ message: 'Signup successful!' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/user/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ message: 'Please input a username and password' });
    }

    let user = await User.findOne({ username: username });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const correctPassword = await bcrypt.compare(password, user.password);
    if (!correctPassword) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    res.cookie('token', authToken(user._id), { httpOnly: true, sameSite: 'strict', secure: false });

    res.json({
      message: 'Login successful',
      data: user.data
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

async function authenticate(req, res, next) {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Unauthorized' });
  }
};

app.delete('/api/user', authenticate, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.userId);

    res.clearCookie('token');
    res.json({ message: 'Account deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete account.' });
  }
});

app.post('/api/user/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out.' });
});

app.post('/api/decks', authenticate, async (req, res) => {
  const { name, cards } = req.body;

  if (name == null || name == '' || !Array.isArray(cards)) {
    return res.status(400).json({ message: 'Invalid deck' });
  }

  try {
    const deck = await Deck.create({ name: name, cards: cards });
    await User.findByIdAndUpdate(req.userId, {
      $push: { decks: deck._id }
    });
    res.json({ message: 'Deck created', deck });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/api/decks', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('decks');
    res.json({ decks: user.decks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.put('/api/decks/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { name, cards } = req.body;

  try {
    const deck = await Deck.findById(id);

    if (!deck) {
      return res.status(400).json({ message: 'Deck not found' });
    }

    console.log(cards)

    deck.name = name;
    deck.cards = cards;

    await deck.save();

    res.json({ message: 'Deck updated successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating deck' });
  }
});

app.delete('/api/decks/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const deck = await Deck.findById(id);

    if (!deck) {
      return res.status(400).json({ message: 'Deck not found' });
    }

    await deck.deleteOne();

    res.json({ message: 'Deck deleted successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting deck' });
  }
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
