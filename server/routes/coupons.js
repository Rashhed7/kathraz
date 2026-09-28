const express = require('express');
const { getQuery, allQuery } = require('../database');

const router = express.Router();

// Validate Coupon
router.post('/validate', async (req, res) => {
  try {
    const { code, subtotal, applied_codes } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Coupon code required' });
    }

    const normalized = code.toUpperCase().trim();

    // Coupons stack, but the same code twice is never allowed.
    const alreadyApplied = Array.isArray(applied_codes)
      ? applied_codes.map((c) => String(c).toUpperCase().trim())
      : [];
    if (alreadyApplied.includes(normalized)) {
      return res.status(400).json({ error: 'That coupon is already applied' });
    }

    const coupon = await getQuery('SELECT * FROM coupons WHERE code = ? AND active = 1', [normalized]);
    if (!coupon) {
      return res.status(404).json({ error: 'Invalid or expired coupon code' });
    }

    if (subtotal && subtotal < coupon.min_order_value) {
      return res.status(400).json({ error: `Minimum order value of ₹${coupon.min_order_value.toLocaleString()} required for this coupon` });
    }

    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = (subtotal * coupon.discount_value) / 100;
    } else {
      discountAmount = coupon.discount_value;
    }

    res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        // Echoed back so the cart can re-check the threshold whenever the
        // subtotal changes, instead of on apply only.
        min_order_value: coupon.min_order_value,
        discount_amount: discountAmount
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

// List Public Active Coupons
router.get('/', async (req, res) => {
  try {
    const coupons = await allQuery('SELECT code, discount_type, discount_value, min_order_value FROM coupons WHERE active = 1');
    res.json({ coupons });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

module.exports = router;
