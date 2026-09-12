const express = require('express');
const { getQuery, allQuery } = require('../database');

const router = express.Router();

// Validate Coupon
router.post('/validate', async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Coupon code required' });
    }

    const coupon = await getQuery('SELECT * FROM coupons WHERE code = ? AND active = 1', [code.toUpperCase().trim()]);
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
