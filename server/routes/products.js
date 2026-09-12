const express = require('express');
const jwt = require('jsonwebtoken');
const { getQuery, allQuery, runQuery } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get Categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await allQuery('SELECT * FROM categories ORDER BY name ASC');
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get Products (with Search, Filtering, Sorting)
router.get('/', async (req, res) => {
  try {
    const { category, search, gender, concentration, minPrice, maxPrice, sort, featured, bestseller } = req.query;

    let sql = `
      SELECT p.*, c.name as category_name, c.slug as category_slug 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      if (!isNaN(category)) {
        sql += ` AND p.category_id = ?`;
        params.push(parseInt(category));
      } else {
        sql += ` AND c.slug = ?`;
        params.push(category);
      }
    }

    if (search) {
      sql += ` AND (p.title LIKE ? OR p.description LIKE ? OR p.top_notes LIKE ? OR p.heart_notes LIKE ? OR p.base_notes LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }

    if (gender) {
      sql += ` AND p.gender = ?`;
      params.push(gender);
    }

    if (concentration) {
      sql += ` AND p.concentration LIKE ?`;
      params.push(`%${concentration}%`);
    }

    if (minPrice) {
      sql += ` AND p.base_price >= ?`;
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      sql += ` AND p.base_price <= ?`;
      params.push(parseFloat(maxPrice));
    }

    if (featured === 'true' || featured === '1') {
      sql += ` AND p.is_featured = 1`;
    }

    if (bestseller === 'true' || bestseller === '1') {
      sql += ` AND p.is_bestseller = 1`;
    }

    // Sort order
    if (sort === 'price_asc') {
      sql += ` ORDER BY p.base_price ASC`;
    } else if (sort === 'price_desc') {
      sql += ` ORDER BY p.base_price DESC`;
    } else if (sort === 'newest') {
      sql += ` ORDER BY p.id DESC`;
    } else {
      sql += ` ORDER BY p.is_featured DESC, p.id DESC`;
    }

    const products = await allQuery(sql, params);

    // Fetch variants and rating summaries for each product
    for (let product of products) {
      const variants = await allQuery('SELECT * FROM variants WHERE product_id = ? ORDER BY price ASC', [product.id]);
      product.variants = variants;

      const ratingSummary = await getQuery('SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE product_id = ?', [product.id]);
      product.avg_rating = ratingSummary.avg_rating ? parseFloat(ratingSummary.avg_rating.toFixed(1)) : 5.0;
      product.review_count = ratingSummary.review_count || 0;

      if (product.gallery_json) {
        try {
          product.gallery = JSON.parse(product.gallery_json);
        } catch (e) {
          product.gallery = [product.image_url];
        }
      } else {
        product.gallery = [product.image_url];
      }
    }

    res.json({ products });
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get Single Product by ID or Slug
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    let product;

    if (!isNaN(identifier)) {
      product = await getQuery(`
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
      `, [parseInt(identifier)]);
    } else {
      product = await getQuery(`
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.slug = ?
      `, [identifier]);
    }

    if (!product) {
      return res.status(404).json({ error: 'Fragrance not found' });
    }

    const variants = await allQuery('SELECT * FROM variants WHERE product_id = ? ORDER BY price ASC', [product.id]);
    product.variants = variants;

    const reviews = await allQuery('SELECT * FROM reviews WHERE product_id = ? ORDER BY id DESC', [product.id]);
    product.reviews = reviews;

    const ratingSummary = await getQuery('SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE product_id = ?', [product.id]);
    product.avg_rating = ratingSummary.avg_rating ? parseFloat(ratingSummary.avg_rating.toFixed(1)) : 5.0;
    product.review_count = ratingSummary.review_count || 0;

    if (product.gallery_json) {
      try {
        product.gallery = JSON.parse(product.gallery_json);
      } catch (e) {
        product.gallery = [product.image_url];
      }
    } else {
      product.gallery = [product.image_url];
    }

    res.json({ product });
  } catch (error) {
    console.error('Fetch product detail error:', error);
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
});

// Post Product Review
router.post('/:id/reviews', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { rating, title, comment, user_name } = req.body;

    if (!rating || !comment || !user_name) {
      return res.status(400).json({ error: 'Rating, name, and comment are required' });
    }

    let userId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.decode(token);
        if (decoded && decoded.id) userId = decoded.id;
      } catch (e) {}
    }

    await runQuery(`
      INSERT INTO reviews (product_id, user_id, user_name, rating, title, comment)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [productId, userId, user_name, rating, title || 'Verified Experience', comment]);

    res.status(201).json({ message: 'Review published successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

module.exports = router;
