import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Truck, Calendar, ArrowRight, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function MyOrdersPage() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [token]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders/my-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      {/* Profile Header */}
      <div className="bg-card border border-gold/20 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gold/20 border border-gold flex items-center justify-center text-gold font-sans text-xl font-bold">
            {user?.name ? user.name[0] : 'K'}
          </div>
          <div>
            <h1 className="font-sans text-2xl font-bold text-ivory">{user?.name}</h1>
            <p className="text-xs text-muted font-num">{user?.email}</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-gold/20 text-gold text-xs font-bold uppercase rounded-full border border-gold/30">
          Member Account
        </span>
      </div>

      <div className="space-y-4">
        <h2 className="font-sans text-xl font-bold text-ivory flex items-center gap-2">
          <Package className="w-5 h-5 text-gold" /> Order Vault & History ({orders.length})
        </h2>

        {loading ? (
          <div className="py-16 text-center text-gold text-sm animate-pulse">Loading Orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-card border border-gold/20 rounded-2xl space-y-3">
            <p className="text-sm text-muted">You have not placed any orders yet.</p>
            <Link to="/shop" className="btn-gold inline-block px-6 py-2.5 rounded text-xs uppercase font-bold">
              Discover Fragrances
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => (
              <div key={ord.id} className="bg-card border border-gold/20 rounded-2xl p-6 shadow-xl glass-panel space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gold/15 pb-4 gap-2">
                  <div>
                    <span className="text-xs text-muted block">Order ID</span>
                    <span className="font-num text-base font-bold text-gold">{ord.order_number}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {new Date(ord.created_at).toLocaleDateString()}
                    </span>
                    <span className="px-3 py-1 bg-gold/20 text-gold text-xs font-bold rounded-full uppercase">
                      {ord.order_status}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {ord.items && ord.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs p-2.5 rounded bg-obsidian border border-gold/10">
                      <div>
                        <span className="font-bold text-ivory font-sans">{item.product_title}</span>
                        <span className="text-gold block text-[10px]">{item.size_label} x {item.quantity}</span>
                      </div>
                      <span className="font-num font-bold text-gold">{formatPrice(item.total)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-gold/15 pt-4 gap-2 text-xs">
                  <div>
                    <span className="text-muted">Total Paid: </span>
                    <strong className="font-num text-base text-gold">{formatPrice(ord.total_amount)}</strong>
                  </div>
                  <Link
                    to={`/track-order?query=${ord.order_number}`}
                    className="btn-outline-gold px-4 py-2 rounded text-xs font-bold uppercase flex items-center gap-1"
                  >
                    <Truck className="w-3.5 h-3.5" /> Track Live Delivery <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
