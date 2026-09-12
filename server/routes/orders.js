const express = require('express');
const { getQuery, allQuery, runQuery } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create Order (Razorpay ready)
router.post('/', async (req, res) => {
  try {
    const { customer_name, customer_email, phone, shipping_address, cart_items, coupon_code, payment_method, gift_message } = req.body;

    if (!customer_name || !customer_email || !phone || !shipping_address || !cart_items || cart_items.length === 0) {
      return res.status(400).json({ error: 'Incomplete shipping or cart details' });
    }

    let userId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const { JWT_SECRET } = require('../middleware/auth');
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded) userId = decoded.id;
      } catch (e) {}
    }

    // Calculate Subtotal & verify stock
    let subtotal = 0;
    const itemsToInsert = [];

    for (let item of cart_items) {
      const variant = await getQuery('SELECT v.*, p.title as product_title FROM variants v JOIN products p ON v.product_id = p.id WHERE v.id = ?', [item.variant_id]);
      if (!variant) {
        return res.status(400).json({ error: `Variant ID ${item.variant_id} not found` });
      }

      if (variant.stock_quantity < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${variant.product_title} (${variant.size_label})` });
      }

      const itemTotal = variant.price * item.quantity;
      subtotal += itemTotal;
      itemsToInsert.push({
        product_id: variant.product_id,
        variant_id: variant.id,
        product_title: variant.product_title,
        size_label: variant.size_label,
        price: variant.price,
        quantity: item.quantity,
        total: itemTotal
      });
    }

    // Process Coupon if provided
    let discountAmount = 0;
    if (coupon_code) {
      const coupon = await getQuery('SELECT * FROM coupons WHERE code = ? AND active = 1', [coupon_code.toUpperCase().trim()]);
      if (coupon) {
        if (subtotal >= coupon.min_order_value) {
          if (coupon.discount_type === 'percentage') {
            discountAmount = (subtotal * coupon.discount_value) / 100;
          } else {
            discountAmount = coupon.discount_value;
          }
          if (discountAmount > subtotal) discountAmount = subtotal;

          // Increment coupon usage
          await runQuery('UPDATE coupons SET times_used = times_used + 1 WHERE id = ?', [coupon.id]);
        }
      }
    }

    const shippingFee = subtotal >= 5000 ? 0 : 350;
    const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

    // Generate Order Number KTZ-XXXXX
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `KTZ-${randomSuffix}`;
    const initialStatus = 'Confirmed';
    const paymentStatus = payment_method === 'COD' ? 'Pending' : 'Paid';

    const orderRes = await runQuery(`
      INSERT INTO orders (order_number, user_id, customer_name, customer_email, shipping_address, phone, payment_method, payment_status, order_status, subtotal, discount_amount, shipping_fee, total_amount, tracking_number, gift_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderNumber,
      userId,
      customer_name,
      customer_email,
      shipping_address,
      phone,
      payment_method || 'Razorpay',
      paymentStatus,
      initialStatus,
      subtotal,
      discountAmount,
      shippingFee,
      totalAmount,
      `KEX-${Math.floor(100000 + Math.random() * 900000)}`,
      gift_message || ''
    ]);

    const orderId = orderRes.lastID;

    // Insert order items & reduce stock
    for (let item of itemsToInsert) {
      await runQuery(`
        INSERT INTO order_items (order_id, product_id, variant_id, product_title, size_label, price, quantity, total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [orderId, item.product_id, item.variant_id, item.product_title, item.size_label, item.price, item.quantity, item.total]);

      // Deduct stock
      await runQuery('UPDATE variants SET stock_quantity = stock_quantity - ? WHERE id = ?', [item.quantity, item.variant_id]);
    }

    // Insert Razorpay payment record mock/live entry
    const razorpayOrderId = `rzp_order_${Math.random().toString(36).substring(2, 12)}`;
    await runQuery(`
      INSERT INTO payments (order_id, razorpay_order_id, razorpay_payment_id, payment_status, amount)
      VALUES (?, ?, ?, ?, ?)
    `, [orderId, razorpayOrderId, `pay_${Math.random().toString(36).substring(2, 12)}`, paymentStatus === 'Paid' ? 'SUCCESS' : 'PENDING', totalAmount]);

    const createdOrder = await getQuery('SELECT * FROM orders WHERE id = ?', [orderId]);
    const orderItems = await allQuery('SELECT * FROM order_items WHERE order_id = ?', [orderId]);

    res.status(201).json({
      message: 'Order created successfully',
      order: createdOrder,
      items: orderItems,
      razorpay: {
        order_id: razorpayOrderId,
        amount: totalAmount * 100, // paise
        currency: 'INR',
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_KATHRAZ_LUXURY_KEY'
      }
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to process order' });
  }
});

// Get User Orders
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const orders = await allQuery('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', [req.user.id]);
    for (let order of orders) {
      order.items = await allQuery('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    }
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user orders' });
  }
});

// Track Order Publicly
// Forgiving matching: case-insensitive, and ignores spaces/dashes so
// "ktz 89210", "KTZ-89210" and "ktz89210" all find the same order.
router.get('/track/:query', async (req, res) => {
  try {
    const raw = String(req.params.query || '').trim().toLowerCase();
    const stripped = raw.replace(/[\s-]/g, '');
    const order = await getQuery(
      `SELECT * FROM orders
       WHERE LOWER(order_number) = ?
          OR REPLACE(REPLACE(LOWER(order_number), '-', ''), ' ', '') = ?
          OR LOWER(tracking_number) = ?
          OR REPLACE(REPLACE(LOWER(tracking_number), '-', ''), ' ', '') = ?
          OR LOWER(customer_email) = ?
       ORDER BY id DESC`,
      [raw, stripped, raw, stripped, raw]
    );

    if (!order) {
      return res.status(404).json({ error: 'No order found with the provided details' });
    }

    order.items = await allQuery('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    res.json({ order });
  } catch (error) {
    res.status(500).json({ error: 'Failed to track order' });
  }
});

module.exports = router;
