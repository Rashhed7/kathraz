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
      return res.status(400).json({ error: 'Title, base price, and category are required' });
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
      sale_price || null,
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
      JSON.stringify(gallery || [image_url || '/images/oud_royal.jpg'])
    ]);

    const productId = result.lastID;

    // Add variants if provided
    if (variants && Array.isArray(variants)) {
      for (let v of variants) {
        await runQuery(`
          INSERT INTO variants (product_id, size_label, price, sku, stock_quantity)
          VALUES (?, ?, ?, ?, ?)
        `, [productId, v.size_label, v.price, v.sku || `KTZ-${productId}-${v.size_label.replace(/\s+/g, '')}`, v.stock_quantity || 50]);
      }
    } else {
      // Default variant
      await runQuery(`
        INSERT INTO variants (product_id, size_label, price, sku, stock_quantity)
        VALUES (?, '50ml Standard', ?, ?, 50)
      `, [productId, base_price, `KTZ-${productId}-50ML`]);
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
    const { title, subtitle, description, category_id, base_price, sale_price, gender, concentration, top_notes, heart_notes, base_notes, longevity, sillage, image_url, is_featured, is_bestseller } = req.body;

    if (!title || base_price == null || !category_id) {
      return res.status(400).json({ error: 'Title, base price, and category are required' });
    }

    const basePrice = Number(base_price);
    // Accept null/''/undefined as "no sale price"; otherwise must be a valid number
    const salePrice = sale_price === null || sale_price === '' || sale_price === undefined
      ? null
      : Number(sale_price);

    if (Number.isNaN(basePrice) || basePrice <= 0) {
      return res.status(400).json({ error: 'Base price must be a positive number' });
    }
    if (salePrice !== null && (Number.isNaN(salePrice) || salePrice <= 0)) {
      return res.status(400).json({ error: 'Sale price must be a positive number' });
    }

    const result = await runQuery(`
      UPDATE products SET
        title = ?, subtitle = ?, description = ?, category_id = ?, base_price = ?, sale_price = ?,
        gender = ?, concentration = ?, top_notes = ?, heart_notes = ?, base_notes = ?,
        longevity = ?, sillage = ?, image_url = ?, is_featured = ?, is_bestseller = ?
      WHERE id = ?
    `, [
      title, subtitle || '', description || '', category_id, basePrice, salePrice,
      gender || 'Unisex', concentration || 'Extrait de Parfum', top_notes || '', heart_notes || '', base_notes || '',
      longevity || '12+ Hours', sillage || 'Intense', image_url, is_featured ? 1 : 0, is_bestseller ? 1 : 0, id
    ]);

    if (!result.changes) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updated = await getQuery('SELECT * FROM products WHERE id = ?', [id]);
    res.json({ message: 'Product updated successfully', product: updated });
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

module.exports = router;
