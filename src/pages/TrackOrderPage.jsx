import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Truck, Package, CheckCircle2, Clock } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function TrackOrderPage() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('query') || '';
  const [query, setQuery] = useState(initialQuery);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { formatPrice } = useCart();

  useEffect(() => {
    if (initialQuery) {
      handleTrack(initialQuery);
    }
  }, [initialQuery]);

  const handleTrack = async (searchKey) => {
    const term = searchKey || query;
    if (!term) return;

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const res = await fetch(`/api/orders/track/${encodeURIComponent(term.trim())}`);
      const data = await res.json();
      if (res.ok && data.order) {
        setOrder(data.order);
      } else {
        setError(data.error || 'No matching order found');
      }
    } catch (e) {
      setError('Failed to track order');
    } finally {
      setLoading(false);
    }
  };

  const statusSteps = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];
  const getStepIndex = (status) => {
    const idx = statusSteps.indexOf(status);
    return idx >= 0 ? idx : 1;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <span className="text-xs uppercase tracking-widest text-gold font-semibold flex items-center justify-center gap-1">
          <Truck className="w-4 h-4" /> Courier
        </span>
        <h1 className="font-sans text-3xl sm:text-4xl font-bold text-ivory">Track your order</h1>
        <p className="text-xs text-muted font-light max-w-md mx-auto">
          Enter your order number, tracking code, or the email address you ordered with.
        </p>
      </div>

      {/* Search Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleTrack();
        }}
        className="max-w-xl mx-auto flex flex-col sm:flex-row gap-2.5 sm:gap-2"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Order # (KTZ-89210) or Email..."
            required
            className="w-full bg-card border border-gold/30 text-sm text-ivory px-4 py-3.5 pl-10 rounded-xl focus:outline-none focus:border-gold font-num"
          />
          <Search className="w-4 h-4 text-gold absolute left-3.5 top-4" />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-gold sm:w-auto w-full px-6 py-3.5 rounded-xl text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-1 shadow-lg disabled:opacity-50"
        >
          {loading ? 'Searching…' : 'Track'}
        </button>
      </form>

      {error && (
        <div className="max-w-xl mx-auto p-4 bg-charcoal border border-ivory/40 rounded-xl text-xs text-ivory text-center">
          {error}
        </div>
      )}

      {/* Order Status Display */}
      {order && (
        <div className="bg-card border border-gold/30 rounded-2xl p-6 sm:p-8 space-y-8 shadow-2xl glass-panel animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gold/15 pb-4 gap-2">
            <div>
              <span className="text-xs text-muted block">Order ID</span>
              <span className="font-num text-xl font-bold text-gold">{order.order_number}</span>
            </div>
            <div className="text-right">
              {order.courier_name && (
                <span className="text-xs text-muted block font-num">Courier: {order.courier_name}</span>
              )}
              {order.tracking_number && (
                <span className="font-num text-xs font-bold text-ivory">Tracking ID: {order.tracking_number}</span>
              )}
            </div>
          </div>

          {/* Visual Step Bar */}
          <div className="space-y-4">
            <h3 className="text-xs text-muted uppercase tracking-wider font-semibold">Delivery progress</h3>
            <div className="relative flex items-center justify-between px-1 sm:px-4">
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-1 bg-gold/20 -z-0">
                <div
                  className="bg-gold h-full transition-all duration-700"
                  style={{ width: `${(getStepIndex(order.order_status) / (statusSteps.length - 1)) * 100}%` }}
                ></div>
              </div>

              {statusSteps.map((step, idx) => {
                const currentIdx = getStepIndex(order.order_status);
                const isDone = idx <= currentIdx;
                return (
                  <div key={step} className="relative z-10 flex flex-col items-center gap-1 text-center min-w-0">
                    <div
                      className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all border-2 ${
                        isDone
                          ? 'bg-gold border-gold text-charcoal shadow-lg shadow-gold/30'
                          : 'bg-obsidian border-gold/30 text-muted'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span className={`text-[9px] sm:text-[11px] font-medium mt-1 ${isDone ? 'text-gold' : 'text-muted'}`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-t border-gold/15 pt-6">
            <div>
              <strong className="text-gold block mb-1">Customer & Destination</strong>
              <p className="text-ivory">{order.customer_name}</p>
              <p className="text-muted">{order.shipping_address}</p>
            </div>
            <div className="text-right sm:text-right">
              <strong className="text-gold block mb-1">Total Paid</strong>
              <span className="font-num text-xl font-bold text-gold">{formatPrice(order.total_amount)}</span>
              <p className="text-[10px] text-muted font-num mt-1">Payment status: {order.payment_status}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
