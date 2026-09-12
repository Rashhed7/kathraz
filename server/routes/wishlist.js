const express = require('express');
const { getQuery, allQuery, runQuery } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get User Wishlist
router.get('/', authenticateToken, async (req, res) => {
  try {
    const items = await allQuery(`
      SELECT w.id as wishlist_id, p.*
      FROM wishlists w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ?
    `, [req.user.id]);
    res.json({ wishlist: items });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// Toggle Wishlist
router.post('/toggle', authenticateToken, async (req, res) => {
  try {
    const { product_id } = req.body;
    if (!product_id) {
      return res.status(400).json({ error: 'Product ID required' });
    }

    const existing = await getQuery('SELECT * FROM wishlists WHERE user_id = ? AND product_id = ?', [req.user.id, product_id]);
    if (existing) {
      await runQuery('DELETE FROM wishlists WHERE id = ?', [existing.id]);
      res.json({ added: false, message: 'Removed from wishlist' });
    } else {
      await runQuery('INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)', [req.user.id, product_id]);
      res.json({ added: true, message: 'Added to luxury wishlist' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update wishlist' });
  }
});

module.exports = router;
