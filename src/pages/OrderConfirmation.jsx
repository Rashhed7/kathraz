import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Package, Printer, ArrowRight, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('orderNumber');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCart();

  useEffect(() => {
    if (orderNumber) {
      fetchOrder();
    }
  }, [orderNumber]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/track/${orderNumber}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-8 text-center">
      <div className="w-20 h-20 rounded-full bg-gold/20 border-2 border-gold flex items-center justify-center mx-auto text-gold shadow-2xl animate-bounce">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <div className="space-y-2">
        <span className="text-xs uppercase tracking-[0.25em] text-gold font-semibold flex items-center justify-center gap-1">
          Order Confirmed
        </span>
        <h1 className="font-sans text-3xl sm:text-4xl font-bold text-ivory">Thank you for your order</h1>
        <p className="text-xs text-muted font-light max-w-md mx-auto">
          Your order has been recorded in the KATHRAZ vault. An official invoice and courier tracking details have been dispatched to your email.
        </p>
      </div>

      {order && (
        <div className="bg-card border border-gold/30 rounded-2xl p-6 sm:p-8 text-left space-y-6 shadow-2xl glass-panel">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gold/15 pb-4 gap-2">
            <div>
              <span className="text-xs text-muted block">Order Number</span>
              <span className="font-num text-xl font-bold text-gold">{order.order_number}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted block">Status</span>
              <span className="inline-block px-3 py-1 bg-gold/20 text-gold text-xs font-bold rounded-full uppercase">
                {order.order_status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <strong className="text-gold block mb-1">Customer Details</strong>
              <p className="text-ivory">{order.customer_name}</p>
              <p className="text-muted">{order.customer_email}</p>
              <p className="text-muted">{order.phone}</p>
            </div>
            <div>
              <strong className="text-gold block mb-1">Shipping & Tracking</strong>
              <p className="text-ivory">{order.shipping_address}</p>
              <p className="text-gold font-num mt-1">Courier: {order.courier_name}</p>
              <p className="text-muted font-num">Tracking ID: {order.tracking_number}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-3 border-t border-gold/15 pt-4">
            <strong className="text-gold text-xs uppercase block">Ordered Fragrance Creations</strong>
            {order.items && order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-xs p-2 rounded bg-obsidian border border-gold/10">
                <div>
                  <span className="font-bold text-ivory font-sans">{item.product_title}</span>
                  <span className="text-gold block text-[10px]">{item.size_label} x {item.quantity}</span>
                </div>
                <span className="font-num font-bold text-gold">{formatPrice(item.total)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center text-sm font-bold text-ivory pt-3 border-t border-gold/15">
            <span className="font-sans">Total Amount Paid</span>
            <span className="font-num text-xl text-gold">{formatPrice(order.total_amount)}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a
          href={`/invoice/${orderNumber}`}
          className="btn-outline-gold px-6 py-3 text-xs uppercase tracking-[0.15em] flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Download Invoice (PDF)
        </a>
        <Link
          to={`/track-order?query=${orderNumber}`}
          className="btn-gold px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2"
        >
          <Truck className="w-4 h-4" /> Live Courier Tracking <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
