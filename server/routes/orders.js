const express = require('express');
const crypto = require('crypto');
const { getQuery, allQuery, runQuery } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { sendEmail, orderPlacedEmail, orderStatusEmail } = require('../utils/mailer');
const { buildInvoicePdf } = require('../utils/invoicePdf');

const router = express.Router();

// Create a Razorpay order via plain fetch() — works identically on Node and
// Cloudflare Workers. (The official SDK uses axios over node:http, which is
// unreliable under the Workers runtime and surfaced as "gateway unavailable".)
async function createRazorpayOrder({ amount, currency = 'INR', receipt, notes }) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    const err = new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
    err.status = 503;
    throw err;
  }

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ amount, currency, receipt, notes })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error?.description || `Razorpay API error (HTTP ${res.status})`);
    err.status = 502;
    err.razorpay = data?.error || null;
    throw err;
  }
  return data;
}

// Verify the HMAC-SHA256 signature Razorpay returns after checkout
function verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, signature) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature || '')
  );
}

// Create Order (Razorpay)
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

    const shippingFee = subtotal >= 5000 ? 0 : 59;
    const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

    // Generate Order Number KTZ-XXXXX
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `KTZ-${randomSuffix}`;

    const isRazorpay = (payment_method || 'Razorpay') !== 'COD';

    // Create the REAL Razorpay order BEFORE writing anything to our DB,
    // so a gateway failure never leaves a half-created order behind.
    let razorpayOrder = null;
    if (isRazorpay) {
      try {
        razorpayOrder = await createRazorpayOrder({
          amount: Math.round(totalAmount * 100), // paise
          currency: 'INR',
          receipt: orderNumber,
          notes: { customer_email, customer_name }
        });
      } catch (rzpError) {
        console.error('Razorpay order creation failed:', rzpError.razorpay || rzpError.message);
        const msg = rzpError.razorpay?.description || rzpError.message || 'Payment gateway is unavailable. Please try again.';
        return res.status(rzpError.status || 502).json({ error: msg });
      }
    }

    const initialStatus = isRazorpay ? 'Pending' : 'Confirmed';
    const paymentStatus = 'Pending'; // becomes 'Paid' only after verified payment (or COD delivery)

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
      // No courier/tracking yet — the admin sets these manually when marking
      // the order Shipped.
      null,
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

    // Record the pending payment with the real Razorpay order id
    if (razorpayOrder) {
      await runQuery(`
        INSERT INTO payments (order_id, razorpay_order_id, razorpay_payment_id, payment_status, amount)
        VALUES (?, ?, ?, ?, ?)
      `, [orderId, razorpayOrder.id, null, 'PENDING', totalAmount]);
    }

    const createdOrder = await getQuery('SELECT * FROM orders WHERE id = ?', [orderId]);
    const orderItems = await allQuery('SELECT * FROM order_items WHERE order_id = ?', [orderId]);

    // Order-placed email with the itemized tax invoice attached as a PDF.
    // IMPORTANT: this MUST be awaited. On Cloudflare Workers the isolate is
    // frozen the moment the response is sent, so fire-and-forget fetches
    // (like the Brevo call) get killed silently — the email never goes out.
    // PDF failure degrades to a plain email; email failure never fails the
    // order (sendEmail catches its own errors and returns false).
    try {
      const { subject, html, text } = orderPlacedEmail({ order: createdOrder, items: orderItems });
      let attachment;
      try {
        const pdf = await buildInvoicePdf(createdOrder, orderItems);
        attachment = { name: `KATHRAZ-Invoice-${createdOrder.order_number}.pdf`, content: pdf };
      } catch (pdfErr) {
        console.error('[invoice-pdf] generation failed:', pdfErr.message);
      }
      await sendEmail({ to: customer_email, subject, html, text, attachment });
    } catch (emailErr) {
      console.error('[order-email] failed:', emailErr.message);
    }

    res.status(201).json({
      message: 'Order created successfully',
      order: createdOrder,
      items: orderItems,
      razorpay: razorpayOrder
        ? {
            order_id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key: process.env.RAZORPAY_KEY_ID
          }
        : null
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to process order' });
  }
});

// Verify Razorpay payment after checkout completes (called by the frontend handler)
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ verified: false, error: 'Missing payment details' });
    }

    let valid = false;
    try {
      valid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    } catch (e) {
      valid = false;
    }

    if (!valid) {
      console.error('Razorpay signature verification failed for payment:', razorpay_payment_id);
      return res.status(400).json({ verified: false, error: 'Payment verification failed' });
    }

    // Find the order linked to this Razorpay order
    const payment = await getQuery('SELECT * FROM payments WHERE razorpay_order_id = ?', [razorpay_order_id]);
    if (!payment) {
      return res.status(404).json({ verified: false, error: 'Payment record not found' });
    }

    // Mark payment SUCCESS and order Paid/Confirmed
    await runQuery(
      'UPDATE payments SET razorpay_payment_id = ?, razorpay_signature = ?, payment_status = ? WHERE id = ?',
      [razorpay_payment_id, razorpay_signature, 'SUCCESS', payment.id]
    );

    await runQuery(
      `UPDATE orders SET payment_status = 'Paid', order_status = 'Confirmed' WHERE id = ?`,
      [payment.order_id]
    );

    const updatedOrder = await getQuery('SELECT order_number FROM orders WHERE id = ?', [payment.order_id]);

    // Payment received -> send confirmation email (async, non-blocking)
    if (updatedOrder) {
      const fullOrder = await getQuery('SELECT * FROM orders WHERE id = ?', [payment.order_id]);
      const items = await allQuery('SELECT * FROM order_items WHERE order_id = ?', [payment.order_id]);
      const { subject, html, text } = orderStatusEmail({
        order: fullOrder,
        items,
        newStatus: 'Confirmed',
        paymentStatus: 'Paid',
      });
      // Awaited — see the note in POST / about Workers freezing the isolate
      // once the response is sent.
      try {
        await sendEmail({ to: fullOrder.customer_email, subject, html, text });
      } catch (emailErr) {
        console.error('[status-email] failed:', emailErr.message);
      }
    }

    res.json({
      verified: true,
      order_number: updatedOrder?.order_number || null
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ verified: false, error: 'Failed to verify payment' });
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
