import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, CreditCard, Lock, MapPin, User, Phone, Mail, ArrowRight, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import RazorpayModal from '../components/RazorpayModal';

export default function CheckoutPage() {
  const { cart, subtotalINR, discountINR, shippingINR, totalINR, formatPrice, appliedCoupon, setAppliedCoupon, giftMessage, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [paymentMethod, setPaymentMethod] = useState('Razorpay');

  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState('');
  const [createdOrderPayload, setCreatedOrderPayload] = useState(null);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name);
      if (!customerEmail) setCustomerEmail(user.email);
    }
  }, [user]);

  // Re-validate an already-applied coupon whenever the subtotal changes (e.g. quantity edits)
  useEffect(() => {
    if (appliedCoupon) {
      if (subtotalINR < (appliedCoupon.min_order_value || 0)) {
        setAppliedCoupon(null);
        setCouponSuccess('');
        setCouponError('Coupon removed — minimum order value no longer met');
      } else {
        const newDiscount = appliedCoupon.discount_type === 'percentage'
          ? (subtotalINR * appliedCoupon.discount_value) / 100
          : appliedCoupon.discount_value;
        setAppliedCoupon({ ...appliedCoupon, discount_amount: newDiscount });
      }
    }
  }, [subtotalINR]);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponError('');
    setCouponSuccess('');
    setValidatingCoupon(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, subtotal: subtotalINR })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedCoupon(data.coupon);
        setCouponSuccess(`Coupon ${data.coupon.code} applied! You saved ${formatPrice(data.coupon.discount_amount)}`);
        setCouponCode('');
      } else {
        setCouponError(data.error || 'Invalid coupon code');
      }
    } catch (err) {
      setCouponError('Failed to apply coupon');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponSuccess('');
    setCouponError('');
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <h2 className="font-sans text-2xl font-bold text-ivory">No Active Items to Checkout</h2>
        <button onClick={() => navigate('/shop')} className="btn-gold px-6 py-2.5 text-xs font-bold uppercase">Return to Store</button>
      </div>
    );
  }

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setError('');
    setPlacingOrder(true);

    try {
      const token = localStorage.getItem('kathraz_token');
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          customer_name: customerName,
          customer_email: customerEmail,
          phone,
          shipping_address: address,
          cart_items: cart,
          coupon_code: appliedCoupon ? appliedCoupon.code : null,
          payment_method: paymentMethod,
          gift_message: giftMessage
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      setCreatedOrderPayload(data);

      if (paymentMethod === 'Razorpay') {
        setShowRazorpayModal(true);
      } else {
        // COD Direct Success
        clearCart();
        navigate(`/order-confirmation?orderNumber=${data.order.order_number}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleRazorpaySuccess = (razorpayData) => {
    setShowRazorpayModal(false);
    clearCart();
    navigate(`/order-confirmation?orderNumber=${createdOrderPayload.order.order_number}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-28 lg:pb-10 space-y-8">
      <div className="flex items-center justify-between border-b border-gold/15 pb-4">
        <h1 className="font-sans text-3xl font-bold text-ivory">Checkout</h1>
        <span className="text-xs text-gold flex items-center gap-1">
          <ShieldCheck className="w-4 h-4" /> 256-Bit Encrypted
        </span>
      </div>

      <form onSubmit={handleCreateOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Shipping & Contact Info */}
        <div className="lg:col-span-7 bg-card border border-gold/20 rounded-2xl p-6 shadow-2xl glass-panel space-y-6">
          <h2 className="font-sans text-lg font-bold text-ivory flex items-center gap-2 border-b border-gold/15 pb-3">
            <MapPin className="w-5 h-5 text-gold" /> Shipping Address & Contact
          </h2>

          {error && (
            <div className="p-3 bg-red-50 border border-red-400 text-xs text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-muted block mb-1 font-medium">Full Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="w-full bg-obsidian border border-gold/30 text-ivory p-3 rounded-lg focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="text-muted block mb-1 font-medium">Email Address</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                required
                className="w-full bg-obsidian border border-gold/30 text-ivory p-3 rounded-lg focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="text-muted block mb-1 font-medium">Contact Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full bg-obsidian border border-gold/30 text-ivory p-3 rounded-lg focus:outline-none focus:border-gold"
            />
          </div>

          <div className="text-xs">
            <label className="text-muted block mb-1 font-medium">Delivery Address & Postal Code</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="w-full bg-obsidian border border-gold/30 text-ivory p-3 rounded-lg focus:outline-none focus:border-gold h-20"
            />
          </div>

          {/* Payment Method Selector */}
          <div className="pt-4 border-t border-gold/15 space-y-3">
            <h2 className="font-sans text-lg font-bold text-ivory flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gold" /> Payment Method
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('Razorpay')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  paymentMethod === 'Razorpay'
                    ? 'bg-gold/20 border-gold text-gold shadow-lg'
                    : 'bg-obsidian border-gold/20 text-ivory/80 hover:border-gold/50'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>Razorpay (UPI / Cards / NetBanking)</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-num">INSTANT</span>
                </div>
                <p className="text-[11px] text-muted mt-1 font-light">Secure payment via GPay, PhonePe, Cards & Bank</p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('COD')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  paymentMethod === 'COD'
                    ? 'bg-gold/20 border-gold text-gold shadow-lg'
                    : 'bg-obsidian border-gold/20 text-ivory/80 hover:border-gold/50'
                }`}
              >
                <div className="font-bold text-xs">Cash on Delivery (COD)</div>
                <p className="text-[11px] text-muted mt-1 font-light">Pay cash upon delivery</p>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={placingOrder}
            className="w-full btn-gold py-4 rounded-xl text-xs uppercase font-bold tracking-widest flex items-center justify-center gap-2 shadow-2xl disabled:opacity-50"
          >
            {placingOrder ? 'Processing your order...' : `Complete Order & Pay ${formatPrice(totalINR)}`}
          </button>
        </div>

        {/* Order Summary Right */}
        <div className="lg:col-span-5 bg-card border border-gold/20 rounded-2xl p-6 shadow-2xl glass-panel space-y-4">
          <h2 className="font-sans text-lg font-bold text-ivory border-b border-gold/15 pb-3">Items in Order</h2>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={item.variant_id} className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <img src={item.image_url} alt={item.title} className="w-12 h-12 object-cover rounded border border-gold/20" />
                  <div>
                    <h4 className="font-sans font-bold text-ivory">{item.title}</h4>
                    <span className="text-muted block text-[10px]">{item.size_label} x {item.quantity}</span>
                  </div>
                </div>
                <span className="font-num font-bold text-gold">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Apply Coupon */}
          <div className="space-y-2 pt-2">
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-2.5 rounded bg-gold/10 border border-gold/30 text-xs text-gold">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Tag className="w-3.5 h-3.5" /> {appliedCoupon.code} Applied
                </span>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-xs underline text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyCoupon(e); } }}
                  placeholder="Promo Code (e.g. KATHRAZ10)"
                  className="bg-obsidian border border-gold/30 text-xs text-ivory px-3 py-2.5 rounded-lg focus:outline-none focus:border-gold flex-1 uppercase tracking-wider"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={validatingCoupon || !couponCode.trim()}
                  className="btn-outline-gold px-4 py-2.5 text-xs font-semibold uppercase rounded-lg disabled:opacity-50"
                >
                  {validatingCoupon ? '...' : 'Apply'}
                </button>
              </div>
            )}
            {couponError && <p className="text-[11px] text-red-400">{couponError}</p>}
            {couponSuccess && <p className="text-[11px] text-gold">{couponSuccess}</p>}
          </div>

          <div className="space-y-2 text-xs text-muted border-t border-gold/15 pt-4">
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
              <span>Shipping Fee</span>
              <span>{shippingINR === 0 ? <strong className="text-gold">FREE</strong> : formatPrice(shippingINR)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-ivory pt-3 border-t border-gold/15">
              <span className="font-sans">Total</span>
              <span className="font-num text-2xl text-gold">{formatPrice(totalINR)}</span>
            </div>
          </div>
        </div>
      </form>

      {/* Razorpay Interactive Modal */}
      {showRazorpayModal && createdOrderPayload && (
        <RazorpayModal
          isOpen={showRazorpayModal}
          orderDetails={createdOrderPayload}
          onSuccess={handleRazorpaySuccess}
          onClose={() => setShowRazorpayModal(false)}
        />
      )}
    </div>
  );
}
