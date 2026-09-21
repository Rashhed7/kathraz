import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import InvoiceDocument from '../components/InvoiceDocument';

/**
 * Invoice viewer.
 *  - /invoice/:orderNumber  -> single invoice (public, same as order tracking)
 *  - /invoice-all           -> every order, one invoice per page (admin only)
 *
 * "Download PDF" = the browser print dialog -> "Save as PDF" (true vector PDF,
 * works on desktop; on mobile choose Save/Share as PDF from the share sheet).
 */
export default function InvoicePage() {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const { token, isAdmin } = useAuth();
  const isBulk = !orderNumber;

  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isBulk && !isAdmin) {
      navigate('/login?demo=admin');
      return;
    }
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber, isBulk, isAdmin]);

  const fetchInvoices = async () => {
    try {
      if (isBulk) {
        const res = await fetch('/api/admin/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        } else {
          setError('Could not load orders');
        }
      } else {
        const res = await fetch(`/api/orders/track/${orderNumber}`);
        if (res.ok) {
          const data = await res.json();
          setOrders([data.order]);
        } else {
          setError('Order not found');
        }
      }
    } catch (e) {
      setError('Could not load invoices');
    }
  };

  return (
    <div className="min-h-screen bg-ivory/5">
      {/* Toolbar — hidden when printing */}
      <div className="no-print sticky top-0 z-20 bg-obsidian border-b border-ivory/10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {isBulk ? (
            <Link to="/admin" className="flex items-center gap-1.5 text-xs text-muted hover:text-ivory transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
          ) : (
            <Link to={`/track-order?query=${orderNumber}`} className="flex items-center gap-1.5 text-xs text-muted hover:text-ivory transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
          )}
          <div className="flex items-center gap-3">
            {isBulk && orders && (
              <span className="text-[11px] text-muted">
                {orders.length} invoice{orders.length === 1 ? '' : 's'} · one per page
              </span>
            )}
            <button
              onClick={() => window.print()}
              disabled={!orders || orders.length === 0}
              className="btn-gold px-5 py-2.5 text-xs uppercase tracking-[0.15em] flex items-center gap-2 disabled:opacity-40"
            >
              <Printer className="w-4 h-4" /> Print / Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Printable area */}
      <div className="print-area max-w-4xl mx-auto px-4 py-8">
        {error && <p className="text-center text-sm text-ivory py-20">{error}</p>}
        {!error && !orders && <p className="text-center text-sm text-muted py-20">Loading invoice…</p>}
        {!error && orders && orders.length === 0 && (
          <p className="text-center text-sm text-muted py-20">No orders yet.</p>
        )}
        {!error && orders && orders.map((order, idx) => (
          <InvoiceDocument key={order.id || idx} order={order} />
        ))}
      </div>
    </div>
  );
}
