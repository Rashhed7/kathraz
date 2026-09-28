import React, { createContext, useState, useEffect, useContext } from 'react';

const CartContext = createContext();

const CURRENCIES = {
  INR: { symbol: '₹', rate: 1, name: 'INR' },
  AED: { symbol: 'د.إ', rate: 0.044, name: 'AED' },
  USD: { symbol: '$', rate: 0.012, name: 'USD' }
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('kathraz_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currency, setCurrency] = useState('INR');
  // Coupons stack: a customer can apply several and the discounts add up
  // (10% + 20% = 30% off). Each percentage comes off the FULL subtotal, and
  // the combined discount is clamped to the subtotal so an order can never go
  // below zero. orders.js recomputes all of this server-side — the value here
  // is only a preview.
  const [appliedCoupons, setAppliedCoupons] = useState([]);
  const [giftMessage, setGiftMessage] = useState('');

  useEffect(() => {
    localStorage.setItem('kathraz_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, variant, quantity = 1) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product_id === product.id && item.variant_id === variant.id
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [
          ...prev,
          {
            product_id: product.id,
            variant_id: variant.id,
            title: product.title,
            size_label: variant.size_label,
            price: variant.price,
            image_url: product.image_url,
            quantity: quantity,
            max_stock: variant.stock_quantity
          }
        ];
      }
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (variant_id) => {
    setCart((prev) => prev.filter((item) => item.variant_id !== variant_id));
  };

  const updateQuantity = (variant_id, qty) => {
    if (qty <= 0) {
      removeFromCart(variant_id);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.variant_id === variant_id ? { ...item, quantity: qty } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupons([]);
    setGiftMessage('');
  };

  // Apply a validated coupon. The same code is never counted twice.
  const addCoupon = (coupon) => {
    if (!coupon || !coupon.code) return;
    const code = String(coupon.code).toUpperCase().trim();
    setAppliedCoupons((current) =>
      current.some((c) => String(c.code).toUpperCase() === code)
        ? current
        : [...current, { ...coupon, code }]
    );
  };

  const removeCoupon = (code) => {
    const target = String(code || '').toUpperCase();
    setAppliedCoupons((current) => current.filter((c) => String(c.code).toUpperCase() !== target));
  };

  // Replace the entire cart contents (used by checkout cart validation)
  const replaceCart = (items) => {
    setCart(Array.isArray(items) ? items : []);
  };

  const subtotalINR = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Additive stacking: every coupon's discount is summed, then clamped to the
  // subtotal (no percentage cap, but the cart can never go below ₹0).
  let discountINR = 0;
  for (const coupon of appliedCoupons) {
    discountINR += coupon.discount_type === 'percentage'
      ? (subtotalINR * coupon.discount_value) / 100
      : coupon.discount_value;
  }
  discountINR = Math.min(discountINR, subtotalINR);

  const shippingINR = subtotalINR >= 5000 || cart.length === 0 ? 0 : 59;
  const totalINR = Math.max(0, subtotalINR - discountINR + shippingINR);

  const formatPrice = (amountINR) => {
    const cur = CURRENCIES[currency] || CURRENCIES.INR;
    const converted = amountINR * cur.rate;
    if (currency === 'INR') {
      return `₹${Math.round(converted).toLocaleString('en-IN')}`;
    } else if (currency === 'AED') {
      return `${Math.round(converted).toLocaleString()} د.إ`;
    } else {
      return `$${converted.toFixed(2)}`;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        replaceCart,
        currency,
        setCurrency,
        appliedCoupons,
        setAppliedCoupons,
        addCoupon,
        removeCoupon,
        giftMessage,
        setGiftMessage,
        subtotalINR,
        discountINR,
        shippingINR,
        totalINR,
        formatPrice,
        totalItemsCount: cart.reduce((acc, item) => acc + item.quantity, 0)
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
