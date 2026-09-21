const express = require('express');
const { allQuery } = require('../database');

const router = express.Router();

// GET /api/posts — feed posts for the Home page (public, ordered)
router.get('/', async (req, res) => {
  try {
    const posts = await allQuery(
      'SELECT id, image_url, caption, link_url, media_type FROM instagram_posts ORDER BY position ASC, id DESC LIMIT 12'
    );
    res.json({ posts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

module.exports = router;
