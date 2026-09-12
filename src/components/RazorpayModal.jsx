import React, { useState } from 'react';
import { X, ShieldCheck, CreditCard, Smartphone, Building, CheckCircle2, Lock } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function RazorpayModal({ isOpen, orderDetails, onSuccess, onClose }) {
  const { formatPrice } = useCart();
  const [selectedMethod, setSelectedMethod] = useState('UPI');
  const [upiId, setUpiId] = useState('user@okaxis');
  const [cardNumber, setCardNumber] = useState('4532 8921 7731 9012');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('891');
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  if (!isOpen || !orderDetails) return null;

  const handlePayNow = (e) => {
    e.preventDefault();
    setProcessing(true);

    setTimeout(() => {
      setProcessing(false);
      setPaymentSuccess(true);
      setTimeout(() => {
        onSuccess && onSuccess({
          razorpay_payment_id: `pay_${Math.random().toString(36).substring(2, 12)}`,
          razorpay_order_id: orderDetails.razorpay?.order_id || `rzp_order_${Math.random().toString(36).substring(2, 12)}`,
          payment_method: selectedMethod
        });
      }, 1200);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-obsidian/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-card border border-gold/40 rounded-2xl overflow-hidden shadow-2xl relative">
        {/* Razorpay Brand Top Bar */}
        <div className="bg-charcoal p-4 border-b border-gold/20 flex items-center justify-between text-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm shadow">
              R
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide block">Razorpay Secure Checkout</span>
              <span className="text-[10px] text-blue-200 uppercase tracking-widest font-num">KATHRAZ LUXURY STORE</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Header */}
        <div className="p-4 bg-obsidian border-b border-gold/15 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted block">Order Total</span>
            <span className="font-num text-2xl font-bold text-gold">
              {formatPrice(orderDetails.order.total_amount)}
            </span>
          </div>
          <div className="text-right text-xs">
            <span className="text-muted block">Order Reference</span>
            <span className="font-num text-gold font-bold">{orderDetails.order.order_number}</span>
          </div>
        </div>

        {paymentSuccess ? (
          <div className="p-8 text-center space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-400 flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <h3 className="font-sans text-xl font-bold text-ivory">Payment successful</h3>
            <p className="text-xs text-muted font-light">
              Your transaction has been securely processed via Razorpay API. Generating your invoice...
            </p>
          </div>
        ) : (
          <form onSubmit={handlePayNow} className="p-6 space-y-5">
            {/* Method Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMethod('UPI')}
                className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  selectedMethod === 'UPI' ? 'bg-gold/20 border-gold text-gold shadow-md' : 'border-gold/20 text-muted hover:text-ivory'
                }`}
              >
                <Smartphone className="w-4 h-4" /> UPI / QR
              </button>
              <button
                type="button"
                onClick={() => setSelectedMethod('Card')}
                className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  selectedMethod === 'Card' ? 'bg-gold/20 border-gold text-gold shadow-md' : 'border-gold/20 text-muted hover:text-ivory'
                }`}
              >
                <CreditCard className="w-4 h-4" /> Card
              </button>
              <button
                type="button"
                onClick={() => setSelectedMethod('NetBanking')}
                className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  selectedMethod === 'NetBanking' ? 'bg-gold/20 border-gold text-gold shadow-md' : 'border-gold/20 text-muted hover:text-ivory'
                }`}
              >
                <Building className="w-4 h-4" /> NetBanking
              </button>
            </div>

            {/* Inputs based on method */}
            {selectedMethod === 'UPI' && (
              <div className="space-y-2">
                <label className="text-xs text-muted block font-medium">Virtual Payment Address (VPA)</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. mobile@upi or username@okaxis"
                  required
                  className="w-full bg-obsidian border border-gold/30 text-xs text-ivory p-3 rounded-lg focus:outline-none focus:border-gold font-num"
                />
                <p className="text-[10px] text-gold/80 flex items-center gap-1">
                  Test Mode: Instant approval enabled
                </p>
              </div>
            )}

            {selectedMethod === 'Card' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted block font-medium">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    required
                    className="w-full bg-obsidian border border-gold/30 text-xs text-ivory p-3 rounded-lg focus:outline-none focus:border-gold font-num"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted block font-medium">Expiry</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      required
                      className="w-full bg-obsidian border border-gold/30 text-xs text-ivory p-3 rounded-lg focus:outline-none focus:border-gold text-center font-num"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted block font-medium">CVV</label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      required
                      maxLength="4"
                      className="w-full bg-obsidian border border-gold/30 text-xs text-ivory p-3 rounded-lg focus:outline-none focus:border-gold text-center font-num"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedMethod === 'NetBanking' && (
              <div className="space-y-2">
                <label className="text-xs text-muted block font-medium">Select Bank</label>
                <select className="w-full bg-obsidian border border-gold/30 text-xs text-ivory p-3 rounded-lg focus:outline-none focus:border-gold">
                  <option>HDFC Bank</option>
                  <option>ICICI Bank</option>
                  <option>State Bank of India</option>
                  <option>Axis Bank</option>
                  <option>Kotak Mahindra Bank</option>
                </select>
              </div>
            )}

            {/* Pay Button */}
            <button
              type="submit"
              disabled={processing}
              className="w-full btn-gold py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-charcoal border-t-transparent rounded-full animate-spin"></div>
                  Contacting Bank Gateway...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Pay {formatPrice(orderDetails.order.total_amount)}
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted font-light pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-gold" /> Encrypted with 256-bit SSL Banking Protocol
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
