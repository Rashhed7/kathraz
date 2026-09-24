const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Load .env when running outside Cloudflare (local dev / Render / VPS).
// On Workers, variables come from wrangler secrets/vars instead.
if (process.env.NODE_ENV !== 'production' && process.env.CLOUDFLARE === undefined) {
  try { require('dotenv').config(); } catch { /* dotenv is optional on Workers */ }
}

const { initDatabase } = require('./database');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const couponRoutes = require('./routes/coupons');
const wishlistRoutes = require('./routes/wishlist');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');
const inquiryRoutes = require('./routes/inquiries');
const postRoutes = require('./routes/posts');
const adRoutes = require('./routes/ads');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static images directory (Node runtimes only).
// On Workers, /images/* is served straight from Cloudflare's CDN (dist/images),
// and __dirname/express.static don't work there anyway.
if (!process.env.CLOUDFLARE) {
  app.use('/images', express.static(path.join(__dirname, '../public/images')));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', uploadRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/ads', adRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', brand: 'KATHRAZ FRAGRANCES INDIA', time: new Date() });
});

// Serve production frontend (vite build output) when available (Node runtimes only).
// On Workers, Cloudflare serves dist/ as static assets with an SPA fallback
// (see assets.not_found_handling in wrangler.jsonc) — requests never reach here,
// and __dirname/fs are not usable on that runtime.
if (!process.env.CLOUDFLARE) {
  const distDir = path.join(__dirname, '../dist');
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    // SPA fallback: serve index.html for all non-API routes so client routing works
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/images/')) {
        return res.status(404).json({ error: 'Not found' });
      }
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }
}

module.exports = { app, initDatabase };
