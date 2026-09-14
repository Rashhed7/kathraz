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
      // ILIKE = case-insensitive, so "oud" finds "Oud Royal"
      sql += ` AND (p.title ILIKE ? OR p.description ILIKE ? OR p.top_notes ILIKE ? OR p.heart_notes ILIKE ? OR p.base_notes ILIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    if (gender) {
      sql += ` AND p.gender = ?`;
      params.push(gender);
    }

    if (concentration) {
      sql += ` AND p.concentration ILIKE ?`;
      params.push(`%${concentration.trim()}%`);
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

// Validate Cart Items
// The cart lives in localStorage and can go stale (variant deleted, price
// changed, stock reduced). Checkout calls this on mount so the order request
// only ever contains variants that actually exist, at the current price.
router.post('/validate-cart', async (req, res) => {
  try {
    const { cart_items } = req.body;

    if (!Array.isArray(cart_items)) {
      return res.status(400).json({ error: 'cart_items must be an array' });
    }

    const validItems = [];
    const removedItems = [];
    const adjustments = [];

    for (let item of cart_items) {
      const variant = await getQuery(
        `SELECT v.id, v.size_label, v.price, v.stock_quantity, p.id as product_id, p.title, p.image_url
         FROM variants v
         JOIN products p ON v.product_id = p.id
         WHERE v.id = ?`,
        [item.variant_id]
      );

      if (!variant) {
        removedItems.push({ variant_id: item.variant_id, title: item.title || 'Unknown item' });
        continue;
      }

      // Clamp quantity to available stock (0 => treat as removed)
      const maxQty = Math.max(0, Math.min(item.quantity, variant.stock_quantity));
      if (maxQty === 0) {
        removedItems.push({ variant_id: item.variant_id, title: variant.title });
        continue;
      }
      if (maxQty < item.quantity) {
        adjustments.push({ variant_id: item.variant_id, title: variant.title, type: 'stock', from: item.quantity, to: maxQty });
      }

      if (variant.price !== item.price) {
        adjustments.push({ variant_id: item.variant_id, title: variant.title, type: 'price', from: item.price, to: variant.price });
      }
      
      validItems.push({
        product_id: variant.product_id,
        variant_id: variant.id,
        title: variant.title,
        size_label: variant.size_label,
        price: variant.price,
        image_url: variant.image_url,
        quantity: maxQty,
        max_stock: variant.stock_quantity
      });
    }
    
    res.json({ valid_items: validItems, removed_items: removedItems, adjustments });
  } catch (error) {
    console.error('Cart validation error:', error);
    res.status(500).json({ error: 'Failed to validate cart' });
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
