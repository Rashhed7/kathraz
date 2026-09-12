const express = require('express');
const router = express.Router();
const { runQuery, getQuery, allQuery } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Public: customer submits an inquiry from the Contact page
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }
    if (String(message).length > 5000) {
      return res.status(400).json({ error: 'Message is too long (max 5000 characters)' });
    }

    const result = await runQuery(
      'INSERT INTO inquiries (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [String(name).trim(), String(email).trim().toLowerCase(), subject ? String(subject).trim() : null, String(message).trim()]
    );

    const inquiry = await getQuery('SELECT * FROM inquiries WHERE id = ?', [result.lastID]);
    res.status(201).json({ message: 'Inquiry received', inquiry });
  } catch (error) {
    console.error('Inquiry create error:', error);
    res.status(500).json({ error: 'Failed to submit inquiry' });
  }
});

// Admin: list all inquiries (newest first)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const inquiries = await allQuery('SELECT * FROM inquiries ORDER BY id DESC');
    res.json({ inquiries });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load inquiries' });
  }
});

// Admin: mark as read
router.put('/:id/read', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await runQuery("UPDATE inquiries SET status = 'read' WHERE id = ?", [req.params.id]);
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update inquiry' });
  }
});

// Admin: delete an inquiry
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await runQuery('DELETE FROM inquiries WHERE id = ?', [req.params.id]);
    res.json({ message: 'Inquiry deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete inquiry' });
  }
});

module.exports = router;
