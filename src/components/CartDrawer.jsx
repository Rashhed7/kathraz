import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Trash2, ShoppingBag, ArrowRight, Gift, Tag, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    subtotalINR,
    discountINR,
    shippingINR,
    totalINR,
    formatPrice,
    appliedCoupon,
    setAppliedCoupon,
    giftMessage,
    setGiftMessage
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [showGiftInput, setShowGiftInput] = useState(false);
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, subtotal: subtotalINR })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedCoupon(data.coupon);
        setCouponSuccess(`Coupon ${data.coupon.code} applied! Saved ${formatPrice(data.coupon.discount_amount)}`);
        setCouponCode('');
      } else {
        setCouponError(data.error || 'Invalid coupon code');
      }
    } catch (err) {
      setCouponError('Failed to apply coupon');
    }
  };

  const freeShippingThreshold = 5000;
  const progressPercent = Math.min(100, (subtotalINR / freeShippingThreshold) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-obsidian/80 backdrop-blur-sm transition-opacity animate-fadeIn">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-card border-l border-gold/20 flex flex-col shadow-2xl">
          {/* Drawer Header */}
          <div className="p-6 border-b border-gold/15 flex items-center justify-between bg-obsidian">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-gold" />
              <h2 className="font-sans text-lg font-bold tracking-wider text-ivory">Your Fragrance Bag</h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-ivory/70 hover:text-ivory transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Free Shipping Progress */}
          <div className="px-6 py-3 bg-gold/10 border-b border-gold/15">
            <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
              {subtotalINR >= freeShippingThreshold ? (
                <span className="text-gold flex items-center gap-1">
                  Congratulations! You unlocked Express Shipping
                </span>
              ) : (
                <span className="text-ivory/80">
                  Add <strong className="text-gold">{formatPrice(freeShippingThreshold - subtotalINR)}</strong> more for Free Delivery
                </span>
              )}
            </div>
            <div className="w-full bg-obsidian rounded-full h-1.5 overflow-hidden border border-gold/20">
              <div
                className="bg-gold h-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto border border-gold/20">
                  <ShoppingBag className="w-8 h-8 text-gold/60" />
                </div>
                <p className="text-sm text-muted font-light">Your shopping bag is currently empty.</p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/shop');
                  }}
                  className="btn-gold px-6 py-2.5 rounded text-xs uppercase tracking-wider font-semibold"
                >
                  Explore Fragrances
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.variant_id}
                  className="flex gap-4 p-3 rounded-lg bg-obsidian/60 border border-gold/10 hover:border-gold/30 transition-colors"
                >
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded border border-gold/20"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-sans font-bold text-sm text-ivory leading-tight">{item.title}</h4>
                        <button
                          onClick={() => removeFromCart(item.variant_id)}
                          className="text-muted hover:text-ivory p-1 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-xs text-gold/80 block mt-0.5 font-sans">{item.size_label}</span>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-gold/20 rounded bg-card text-xs">
                        <button
                          onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}
                          className="px-2 py-1 text-ivory hover:text-muted transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-semibold text-ivory">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                          className="px-2 py-1 text-ivory hover:text-muted transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-num font-bold text-sm text-gold">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer & Checkout */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-gold/15 bg-obsidian space-y-4">
              {/* Promo Code & Gift Note Toggles */}
              <div className="space-y-2">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2 rounded bg-gold/10 border border-gold/30 text-xs text-gold">
                    <span className="flex items-center gap-1 font-semibold">
                      <Tag className="w-3.5 h-3.5" /> {appliedCoupon.code} Applied
                    </span>
                    <button
                      onClick={() => setAppliedCoupon(null)}
                      className="text-xs underline text-ivory hover:text-muted"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Promo Code (e.g. KATHRAZ10)"
                      className="bg-card border border-gold/20 text-xs text-ivory px-3 py-2 rounded focus:outline-none focus:border-gold flex-1 uppercase tracking-wider"
                    />
                    <button
                      type="submit"
                      className="btn-outline-gold px-3 py-2 text-xs font-semibold uppercase rounded"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {couponError && <p className="text-[11px] text-ivory">{couponError}</p>}
                {couponSuccess && <p className="text-[11px] text-gold">{couponSuccess}</p>}

                <button
                  onClick={() => setShowGiftInput(!showGiftInput)}
                  className="text-xs text-gold/80 hover:text-gold flex items-center gap-1 font-light pt-1"
                >
                  <Gift className="w-3.5 h-3.5" />
                  {showGiftInput ? 'Hide Gift Message' : 'Add a gift message'}
                </button>
                {showGiftInput && (
                  <textarea
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    placeholder="Write a custom gift note to be printed on KATHRAZ gold-embossed card..."
                    className="w-full bg-card border border-gold/20 text-xs text-ivory p-2.5 rounded focus:outline-none focus:border-gold h-16"
                  />
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-muted pt-2 border-t border-gold/10">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-ivory font-medium">{formatPrice(subtotalINR)}</span>
                </div>
                {discountINR > 0 && (
                  <div className="flex justify-between text-gold">
                    <span>Discount</span>
                    <span>-{formatPrice(discountINR)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{shippingINR === 0 ? <strong className="text-gold font-semibold">FREE</strong> : formatPrice(shippingINR)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-ivory pt-2 border-t border-gold/15">
                  <span className="font-sans tracking-wider">Total</span>
                  <span className="font-num text-lg text-gold">{formatPrice(totalINR)}</span>
                </div>
              </div>

              {/* Checkout CTA Button */}
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/checkout');
                }}
                className="w-full btn-gold py-3 rounded-lg text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                Proceed to Secure Checkout <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
