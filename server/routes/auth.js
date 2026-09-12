const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getQuery, runQuery, allQuery } = require('../database');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register Customer
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await getQuery('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) {
      return res.status(400).json({ error: 'Email address already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await runQuery(
      `INSERT INTO users (name, email, password_hash, role, phone, address) VALUES (?, ?, ?, 'customer', ?, ?)`,
      [name, email.toLowerCase().trim(), hashedPassword, phone || '', address || '']
    );

    const newUser = await getQuery('SELECT id, name, email, role, phone, address FROM users WHERE id = ?', [result.lastID]);
    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await getQuery('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address
    };

    res.json({
      message: 'Logged in successfully',
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get Current User
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await getQuery('SELECT id, name, email, role, phone, address, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update Profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    await runQuery('UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?', [name, phone, address, req.user.id]);
    const updated = await getQuery('SELECT id, name, email, role, phone, address FROM users WHERE id = ?', [req.user.id]);
    res.json({ message: 'Profile updated successfully', user: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
