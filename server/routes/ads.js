const express = require('express');
const { allQuery } = require('../database');

const router = express.Router();

// GET /api/ads — active ad banners for the Home page spotlight (public, ordered)
router.get('/', async (req, res) => {
  try {
    const ads = await allQuery(
      'SELECT id, image_url, headline, subtext, link_url FROM ad_banners WHERE active = 1 ORDER BY position ASC, id ASC LIMIT 6'
    );
    res.json({ ads });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ads' });
  }
});

module.exports = router;
