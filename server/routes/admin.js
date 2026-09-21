const express = require('express');
const { getQuery, allQuery, runQuery } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply auth & admin middleware to all admin endpoints
router.use(authenticateToken);
router.use(requireAdmin);

// 1. Dashboard Analytics KPI
router.get('/analytics', async (req, res) => {
  try {
    const totalRevenueRes = await getQuery(`SELECT SUM(total_amount) as total FROM orders WHERE payment_status = 'Paid' OR order_status != 'Cancelled'`);
    const totalOrdersRes = await getQuery(`SELECT COUNT(*) as total FROM orders`);
    const totalCustomersRes = await getQuery(`SELECT COUNT(*) as total FROM users WHERE role = 'customer'`);
    const totalProductsRes = await getQuery(`SELECT COUNT(*) as total FROM products`);
    const lowStockRes = await getQuery(`SELECT COUNT(*) as total FROM variants WHERE stock_quantity <= 10`);

    const recentOrders = await allQuery(`SELECT * FROM orders ORDER BY id DESC LIMIT 5`);
    const categorySales = await allQuery(`
      SELECT c.name as category, COUNT(oi.id) as total_items, SUM(oi.total) as total_sales
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      GROUP BY c.name
    `);

    res.json({
      analytics: {
        totalRevenue: totalRevenueRes.total || 0,
        totalOrders: totalOrdersRes.total || 0,
        totalCustomers: totalCustomersRes.total || 0,
        totalProducts: totalProductsRes.total || 0,
        lowStockItems: lowStockRes.total || 0
      },
      recentOrders,
      categorySales
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// 2. Product Management (CRUD)
// Create Product
router.post('/products', async (req, res) => {
  try {
    const { title, subtitle, description, category_id, base_price, sale_price, gender, concentration, top_notes, heart_notes, base_notes, longevity, sillage, image_url, gallery, is_featured, is_bestseller, variants } = req.body;

    if (!title || !base_price || !category_id) {
      return res.status(400).json({ error: 'Title, original price, and category are required' });
    }

    const salePrice = sale_price === null || sale_price === '' || sale_price === undefined
      ? null
      : Number(sale_price);
    if (salePrice !== null && (Number.isNaN(salePrice) || salePrice <= 0)) {
      return res.status(400).json({ error: 'Offer price must be a positive number' });
    }
    if (salePrice !== null && salePrice >= Number(base_price)) {
      return res.status(400).json({ error: 'Offer price must be lower than the original price' });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const result = await runQuery(`
      INSERT INTO products (title, slug, subtitle, description, category_id, base_price, sale_price, is_featured, is_bestseller, gender, concentration, top_notes, heart_notes, base_notes, longevity, sillage, image_url, gallery_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title,
      slug,
      subtitle || '',
      description || '',
      category_id,
      base_price,
      salePrice,
      is_featured ? 1 : 0,
      is_bestseller ? 1 : 0,
      gender || 'Unisex',
      concentration || 'Extrait de Parfum',
      top_notes || '',
      heart_notes || '',
      base_notes || '',
      longevity || '12+ Hours',
      sillage || 'Intense',
      image_url || '/images/oud_royal.jpg',
      JSON.stringify(
        Array.isArray(gallery) && gallery.length > 0
          ? gallery.filter((g) => typeof g === 'string' && g.trim() !== '')
          : [image_url || '/images/oud_royal.jpg']
      )
    ]);

    const productId = result.lastID;

    // Add variants if provided
    if (variants && Array.isArray(variants) && variants.length > 0) {
      const seen = new Set();
      for (let v of variants) {
        const sizeLabel = (v.size_label || '').trim();
        const vPrice = Number(v.price);
        if (!sizeLabel || Number.isNaN(vPrice) || vPrice <= 0) {
          return res.status(400).json({ error: 'Every size needs a name and a price greater than 0' });
        }
        const key = sizeLabel.toLowerCase();
        if (seen.has(key)) {
          return res.status(400).json({ error: `Duplicate size name: "${sizeLabel}"` });
        }
        seen.add(key);
        await runQuery(`
          INSERT INTO variants (product_id, size_label, price, sku, stock_quantity)
          VALUES (?, ?, ?, ?, ?)
        `, [productId, sizeLabel, vPrice, v.sku || `KTZ-${productId}-${sizeLabel.replace(/\s+/g, '')}`, Math.max(0, parseInt(v.stock_quantity, 10) || 50)]);
      }
    } else {
      // Default variant — priced at the effective (offer) price so the shop
      // shows the offer, not the original
      await runQuery(`
        INSERT INTO variants (product_id, size_label, price, sku, stock_quantity)
        VALUES (?, '50ml Standard', ?, ?, 50)
      `, [productId, salePrice !== null ? salePrice : base_price, `KTZ-${productId}-50ML`]);
    }

    const created = await getQuery('SELECT * FROM products WHERE id = ?', [productId]);
    res.status(201).json({ message: 'Product created successfully', product: created });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update Product
router.put('/products/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, subtitle, description, category_id, base_price, sale_price, gender, concentration, top_notes, heart_notes, base_notes, longevity, sillage, image_url, gallery, is_featured, is_bestseller, variants } = req.body;

    if (!title || base_price == null || !category_id) {
      return res.status(400).json({ error: 'Title, original price, and category are required' });
    }

    const basePrice = Number(base_price);
    // Accept null/''/undefined as "no offer"; otherwise must be a valid number
    const salePrice = sale_price === null || sale_price === '' || sale_price === undefined
      ? null
      : Number(sale_price);

    if (Number.isNaN(basePrice) || basePrice <= 0) {
      return res.status(400).json({ error: 'Original price must be a positive number' });
    }
    if (salePrice !== null && (Number.isNaN(salePrice) || salePrice <= 0)) {
      return res.status(400).json({ error: 'Offer price must be a positive number' });
    }
    if (salePrice !== null && salePrice >= basePrice) {
      return res.status(400).json({ error: 'Offer price must be lower than the original price' });
    }

    // Load the current row first: we need the OLD effective price to know
    // which variants were "following" it, and to preserve the gallery when
    // the client doesn't send one.
    const existing = await getQuery('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Gallery: array of image URLs. When the client doesn't send one, keep
    // the existing gallery untouched.
    let galleryJson = existing.gallery_json;
    if (Array.isArray(gallery)) {
      const cleaned = gallery.filter((g) => typeof g === 'string' && g.trim() !== '');
      if (cleaned.length > 0) {
        galleryJson = JSON.stringify(cleaned);
      } else if (image_url) {
        galleryJson = JSON.stringify([image_url]);
      }
    }

    await runQuery(`
      UPDATE products SET
        title = ?, subtitle = ?, description = ?, category_id = ?, base_price = ?, sale_price = ?,
        gender = ?, concentration = ?, top_notes = ?, heart_notes = ?, base_notes = ?,
        longevity = ?, sillage = ?, image_url = ?, gallery_json = ?, is_featured = ?, is_bestseller = ?
      WHERE id = ?
    `, [
      title, subtitle || '', description || '', category_id, basePrice, salePrice,
      gender || 'Unisex', concentration || 'Extrait de Parfum', top_notes || '', heart_notes || '', base_notes || '',
      longevity || '12+ Hours', sillage || 'Intense', image_url, galleryJson, is_featured ? 1 : 0, is_bestseller ? 1 : 0, id
    ]);

    // Variant price sync — keeps the shop from ever showing a stale price.
    // 1) Smart-follow (always): variants priced at the OLD effective price
    //    (offer price, or original when no offer) follow the new one.
    //    Variants with custom per-size prices are preserved.
    const oldEffective = existing.sale_price != null ? Number(existing.sale_price) : Number(existing.base_price);
    const newEffective = salePrice !== null ? salePrice : basePrice;
    if (newEffective !== oldEffective) {
      await runQuery(
        `UPDATE variants SET price = ? WHERE product_id = ? AND price = ?`,
        [newEffective, id, oldEffective]
      );
    }

    // 2) Explicit size sync from the admin editor: update existing rows,
    //    insert new sizes, and delete removed ones.
    const warnings = [];
    if (Array.isArray(variants)) {
      const keepIds = [];
      for (const v of variants) {
        const sizeLabel = (v.size_label || '').trim();
        const vPrice = Number(v.price);
        const vStock = Math.max(0, parseInt(v.stock_quantity, 10) || 0);
        if (!sizeLabel || Number.isNaN(vPrice) || vPrice <= 0) {
          return res.status(400).json({ error: 'Every size needs a name and a price greater than 0' });
        }
        if (v.id) {
          await runQuery(
            `UPDATE variants SET size_label = ?, price = ?, stock_quantity = ? WHERE id = ? AND product_id = ?`,
            [sizeLabel, vPrice, vStock, v.id, id]
          );
          keepIds.push(v.id);
        } else {
          const ins = await runQuery(
            `INSERT INTO variants (product_id, size_label, price, sku, stock_quantity)
             VALUES (?, ?, ?, ?, ?)`,
            [id, sizeLabel, vPrice, `KTZ-${id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase(), vStock]
          );
          keepIds.push(ins.lastID);
        }
      }

      // Delete sizes removed in the editor. Sizes referenced by past orders
      // cannot be deleted (order history keeps them) — report instead.
      const existingVariants = await allQuery('SELECT id, size_label FROM variants WHERE product_id = ?', [id]);
      for (const ev of existingVariants) {
        if (!keepIds.includes(ev.id)) {
          try {
            await runQuery('DELETE FROM variants WHERE id = ? AND product_id = ?', [ev.id, id]);
          } catch (e) {
            warnings.push(`Size "${ev.size_label}" has past orders and was kept`);
          }
        }
      }
    }

    const updated = await getQuery('SELECT * FROM products WHERE id = ?', [id]);
    res.json({ message: 'Product updated successfully', product: updated, warnings });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete Product
router.delete('/products/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await runQuery('DELETE FROM products WHERE id = ?', [id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// 3. Order Management & Status Transitions
// List all orders for Admin
router.get('/orders', async (req, res) => {
  try {
    const orders = await allQuery('SELECT * FROM orders ORDER BY id DESC');
    for (let order of orders) {
      order.items = await allQuery('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    }
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin orders' });
  }
});

// Update Order Status (Pending -> Confirmed -> Processing -> Shipped -> Delivered)
router.put('/orders/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { order_status, tracking_number, courier_name, payment_status } = req.body;

    const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (order_status && !validStatuses.includes(order_status)) {
      return res.status(400).json({ error: 'Invalid order status transition' });
    }

    let sql = 'UPDATE orders SET id = id';
    const params = [];

    if (order_status) {
      sql += ', order_status = ?';
      params.push(order_status);
    }

    if (tracking_number) {
      sql += ', tracking_number = ?';
      params.push(tracking_number);
    }

    if (courier_name) {
      sql += ', courier_name = ?';
      params.push(courier_name);
    }

    if (payment_status) {
      sql += ', payment_status = ?';
      params.push(payment_status);
    }

    sql += ' WHERE id = ?';
    params.push(id);

    await runQuery(sql, params);

    const updated = await getQuery('SELECT * FROM orders WHERE id = ?', [id]);
    res.json({ message: `Order status updated to ${updated.order_status}`, order: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// 4. Customer Roster
router.get('/customers', async (req, res) => {
  try {
    const customers = await allQuery(`
      SELECT u.id, u.name, u.email, u.phone, u.address, u.created_at,
             COUNT(o.id) as total_orders,
             COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.role = 'customer'
      GROUP BY u.id
      ORDER BY total_spent DESC
    `);
    res.json({ customers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// 5. Coupon Management (CRUD)
router.get('/coupons', async (req, res) => {
  try {
    const coupons = await allQuery('SELECT * FROM coupons ORDER BY id DESC');
    res.json({ coupons });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

router.post('/coupons', async (req, res) => {
  try {
    const { code, discount_type, discount_value, min_order_value, usage_limit } = req.body;
    await runQuery(`
      INSERT INTO coupons (code, discount_type, discount_value, min_order_value, usage_limit, active)
      VALUES (?, ?, ?, ?, ?, 1)
    `, [code.toUpperCase().trim(), discount_type, discount_value, min_order_value || 0, usage_limit || 100]);
    res.status(201).json({ message: 'Coupon created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

router.delete('/coupons/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await runQuery('DELETE FROM coupons WHERE id = ?', [id]);
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

// 6. Instagram Feed Posts (Home page gallery)
router.get('/posts', async (req, res) => {
  try {
    const posts = await allQuery('SELECT * FROM instagram_posts ORDER BY position ASC, id DESC');
    res.json({ posts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

router.post('/posts', async (req, res) => {
  try {
    const { image_url, caption, link_url, media_type } = req.body;
    if (!image_url) {
      return res.status(400).json({ error: 'A video or image is required' });
    }
    // New posts go to the front of the feed
    const posRes = await getQuery('SELECT MIN(position) as minPos FROM instagram_posts');
    const position = posRes && posRes.minPos != null ? posRes.minPos - 1 : 0;
    const created = await runQuery(
      'INSERT INTO instagram_posts (image_url, caption, link_url, media_type, position) VALUES (?, ?, ?, ?, ?)',
      [image_url, caption || '', link_url || '', media_type === 'video' ? 'video' : 'image', position]
    );
    const post = await getQuery('SELECT * FROM instagram_posts WHERE id = ?', [created.lastID]);
    res.status(201).json({ message: 'Post added', post });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add post' });
  }
});

// Move a post one slot left/right in the feed
router.put('/posts/:id/move', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { direction } = req.body; // 'up' | 'down'
    const posts = await allQuery('SELECT id FROM instagram_posts ORDER BY position ASC, id DESC');
    const idx = posts.findIndex((p) => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Post not found' });
    const swapWith = direction === 'up' ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= posts.length) {
      return res.json({ message: 'Already at the edge' });
    }
    const a = posts[idx];
    const b = posts[swapWith];
    await runQuery('UPDATE instagram_posts SET position = ? WHERE id = ?', [swapWith, a.id]);
    await runQuery('UPDATE instagram_posts SET position = ? WHERE id = ?', [idx, b.id]);
    res.json({ message: 'Order updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reorder posts' });
  }
});

router.delete('/posts/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await runQuery('DELETE FROM instagram_posts WHERE id = ?', [id]);
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

module.exports = router;
