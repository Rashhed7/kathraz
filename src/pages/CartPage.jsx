import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, Tag, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    subtotalINR,
    discountINR,
    shippingINR,
    totalINR,
    formatPrice,
    appliedCoupon,
    setAppliedCoupon
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const navigate = useNavigate();

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, subtotal: subtotalINR })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedCoupon(data.coupon);
        setCouponCode('');
      } else {
        setCouponError(data.error || 'Invalid coupon code');
      }
    } catch (e) {
      setCouponError('Failed to apply coupon');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto border border-gold/20">
          <ShoppingBag className="w-8 h-8 text-gold" />
        </div>
        <h2 className="font-cinzel text-2xl font-bold text-ivory">Your Fragrance Bag is Empty</h2>
        <p className="text-xs text-muted">Discover our collection of Extrait de Parfums and home atmospheres.</p>
        <Link to="/shop" className="btn-gold inline-block px-8 py-3 rounded-lg text-xs uppercase font-bold tracking-wider">
          Explore Treasury
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-28 lg:pb-10 space-y-8">
      <h1 className="font-cinzel text-3xl font-bold text-ivory">Your Shopping Bag</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Table */}
        <div className="lg:col-span-8 bg-card border border-gold/20 rounded-2xl p-6 shadow-2xl glass-panel space-y-4">
          {cart.map((item) => (
            <div
              key={item.variant_id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-obsidian border border-gold/15"
            >
              <div className="flex items-center gap-4">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-20 h-20 object-cover rounded-lg border border-gold/20"
                />
                <div>
                  <h3 className="font-serif font-bold text-base text-ivory">{item.title}</h3>
                  <span className="text-xs text-gold block">{item.size_label}</span>
                  <span className="text-xs text-muted block mt-1">{formatPrice(item.price)} each</span>
                </div>
              </div>

              <div className="flex items-center justify-between flex-wrap w-full sm:w-auto gap-3 sm:gap-6">
                <div className="flex items-center border border-gold/20 rounded bg-card text-xs">
                  <button
                    onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}
                    className="px-3 py-1.5 text-ivory hover:text-gold"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="px-3 font-semibold text-ivory">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                    className="px-3 py-1.5 text-ivory hover:text-gold"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <span className="font-num font-bold text-base text-gold">
                  {formatPrice(item.price * item.quantity)}
                </span>

                <button
                  onClick={() => removeFromCart(item.variant_id)}
                  className="text-muted hover:text-red-400 p-1"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Card */}
        <div className="lg:col-span-4 bg-card border border-gold/20 rounded-2xl p-6 shadow-2xl glass-panel space-y-6">
          <h2 className="font-cinzel text-lg font-bold text-ivory border-b border-gold/15 pb-3">Order Summary</h2>

          {/* Coupon Code */}
          <div className="space-y-2">
            {appliedCoupon ? (
              <div className="p-3 rounded bg-gold/10 border border-gold/30 text-xs text-gold flex items-center justify-between">
                <span className="flex items-center gap-1 font-semibold">
                  <Tag className="w-3.5 h-3.5" /> {appliedCoupon.code} Applied
                </span>
                <button onClick={() => setAppliedCoupon(null)} className="text-red-400 underline">Remove</button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Promo Code (e.g. KATHRAZ10)"
                  className="bg-obsidian border border-gold/30 text-xs text-ivory p-2.5 rounded focus:outline-none focus:border-gold flex-1 uppercase"
                />
                <button type="submit" className="btn-outline-gold px-4 text-xs font-bold uppercase rounded">Apply</button>
              </form>
            )}
            {couponError && <p className="text-[11px] text-red-400">{couponError}</p>}
          </div>

          <div className="space-y-2 text-xs text-muted border-t border-gold/10 pt-4">
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
              <span>Express Delivery</span>
              <span>{shippingINR === 0 ? <strong className="text-gold">FREE</strong> : formatPrice(shippingINR)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-ivory pt-3 border-t border-gold/15">
              <span className="font-cinzel">Total</span>
              <span className="font-num text-xl text-gold">{formatPrice(totalINR)}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full btn-gold py-3.5 rounded-xl text-xs uppercase font-bold tracking-widest flex items-center justify-center gap-2 shadow-xl"
          >
            Proceed to Checkout <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
