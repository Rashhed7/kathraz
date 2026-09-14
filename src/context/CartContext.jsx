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
  const [appliedCoupon, setAppliedCoupon] = useState(null);
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
    setAppliedCoupon(null);
    setGiftMessage('');
  };

  // Replace the entire cart contents (used by checkout cart validation)
  const replaceCart = (items) => {
    setCart(Array.isArray(items) ? items : []);
  };

  const subtotalINR = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  let discountINR = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percentage') {
      discountINR = (subtotalINR * appliedCoupon.discount_value) / 100;
    } else {
      discountINR = appliedCoupon.discount_value;
    }
  }

  const shippingINR = subtotalINR >= 5000 || cart.length === 0 ? 0 : 350;
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
        appliedCoupon,
        setAppliedCoupon,
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
