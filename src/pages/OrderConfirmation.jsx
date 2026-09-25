import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Printer, ArrowRight, Truck, Package, ShieldCheck, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';

/**
 * Order confirmation — the celebration moment.
 * One-shot choreography when the order appears:
 *   ring pulse -> check draws itself -> confetti burst -> stat counters tick up
 * All monochrome, all one-shot (no looping gimmicks), reduced-motion safe.
 */
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
    <div className="max-w-4xl mx-auto px-4 py-14 space-y-10 text-center">
      <CelebrationHeader loading={loading} order={order} />

      {order && (
        <>
          <SatisfactionStats delay={900} />

          <Reveal delay={1100}>
            <OrderSummaryCard order={order} formatPrice={formatPrice} />
          </Reveal>

          <Reveal delay={1300}>
            <ActionRow orderNumber={orderNumber} />
          </Reveal>
        </>
      )}
    </div>
  );
}

/* ---------- Header: check draw + confetti + headline cascade ---------- */

function CelebrationHeader({ loading, order }) {
  const [stage, setStage] = useState(0); // 0 idle -> 1 ring -> 2 check -> 3 confetti/text

  useEffect(() => {
    if (loading) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setStage(3);
      return undefined;
    }
    const timers = [
      setTimeout(() => setStage(1), 100),
      setTimeout(() => setStage(2), 550),
      setTimeout(() => setStage(3), 950),
    ];
    return () => timers.forEach(clearTimeout);
  }, [loading]);

  if (loading) {
    return <div className="py-32 text-center text-muted text-sm">Loading…</div>;
  }

  return (
    <div className="space-y-5">
      {/* Check badge with pulsing rings */}
      <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
        {stage >= 1 && (
          <>
            <span className="celebration-ring" />
            <span className="celebration-ring celebration-ring-delay" />
          </>
        )}
        <div
          className={`relative w-20 h-20 rounded-full bg-ivory text-obsidian flex items-center justify-center celebration-pop ${
            stage >= 1 ? 'is-on' : ''
          }`}
        >
          {stage >= 2 ? (
            <svg viewBox="0 0 52 52" className="w-12 h-12" aria-hidden="true">
              <path
                d="M14 27 L23 36 L38 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="celebration-check"
              />
            </svg>
          ) : (
            <CheckCircle2 className="w-12 h-12 opacity-0" aria-hidden="true" />
          )}
        </div>
        {/* One-shot confetti burst */}
        {stage >= 3 && <Confetti />}
      </div>

      <div className={`space-y-2 celebration-rise ${stage >= 3 ? 'is-on' : ''}`}>
        <span className="text-xs uppercase tracking-[0.25em] text-muted font-semibold block">
          Order confirmed
        </span>
        <h1 className="font-sans text-3xl sm:text-4xl font-bold text-ivory">
          Thank you — we're on it.
        </h1>
        <p className="text-xs text-muted font-light max-w-md mx-auto">
          Your order is sealed and queued for dispatch. A confirmation with your
          invoice and tracking details is on its way to your email.
        </p>
      </div>
    </div>
  );
}

/* ---------- One-shot monochrome confetti ---------- */

function Confetti() {
  // Deterministic pseudo-random so the burst looks composed, not chaotic
  const pieces = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: 8 + ((i * 61) % 84),            // %
      delay: (i % 6) * 60,                  // ms
      duration: 900 + ((i * 137) % 500),    // ms
      drift: ((i * 53) % 120) - 60,         // px sideways
      size: 4 + (i % 3) * 2,                // px
      round: i % 3 === 0,
    }))
  ).current;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className={`celebration-confetti ${p.round ? 'rounded-full' : ''}`}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 2.2,
            animationDelay: `${p.delay}ms`,
            animationDuration: `${p.duration}ms`,
            '--confetti-drift': `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

/* ---------- Satisfaction stats with counting numbers ---------- */

function SatisfactionStats({ delay }) {
  const ref = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div
      ref={ref}
      className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${started ? '' : 'opacity-0'}`}
    >
      <StatTile
        icon={<Package className="w-4 h-4" />}
        value="100%"
        label="Sealed & batch-verified"
        on={started}
        delay={0}
      />
      <StatTile
        icon={<Truck className="w-4 h-4" />}
        value="2–4"
        label="Days to your doorstep"
        on={started}
        delay={140}
      />
      <StatTile
        icon={<Star className="w-4 h-4" />}
        countTo={4.9}
        decimals={1}
        label="Average from our buyers"
        on={started}
        delay={280}
        reduced={reduced}
      />
    </div>
  );
}

function StatTile({ icon, value, countTo, decimals = 0, label, on, delay, reduced }) {
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!on) return undefined;
    if (countTo === undefined || reduced) {
      if (countTo !== undefined) setDisplay(countTo.toFixed(decimals));
      return undefined;
    }
    // Ease-out counter, ~900ms
    const DURATION = 900;
    let raf;
    const t0 = performance.now() + delay;
    const tick = (now) => {
      const t = Math.min(1, Math.max(0, (now - t0) / DURATION));
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay((countTo * eased).toFixed(decimals));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on, countTo, decimals, delay, reduced]);

  return (
    <div
      className="bg-card border border-ivory/10 p-4 flex flex-col items-center gap-1 celebration-stat"
      style={on ? { animationDelay: `${delay}ms` } : undefined}
      data-on={on}
    >
      <span className="text-muted">{icon}</span>
      <span className="font-num text-2xl font-bold text-ivory leading-none">
        {countTo !== undefined ? display : value}
      </span>
      <span className="text-[11px] text-muted">{label}</span>
    </div>
  );
}

/* ---------- Summary + actions (shared with the previous design) ---------- */

function OrderSummaryCard({ order, formatPrice }) {
  return (
    <div className="bg-card border border-ivory/15 rounded-2xl p-6 sm:p-8 text-left space-y-6 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-ivory/10 pb-4 gap-2">
        <div>
          <span className="text-xs text-muted block">Order Number</span>
          <span className="font-num text-xl font-bold text-ivory">{order.order_number}</span>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted block">Status</span>
          <span className="inline-block px-3 py-1 border border-ivory/30 text-ivory text-xs font-bold rounded-full uppercase">
            {order.order_status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <strong className="text-ivory block mb-1">Customer Details</strong>
          <p className="text-ivory">{order.customer_name}</p>
          <p className="text-muted">{order.customer_email}</p>
          <p className="text-muted">{order.phone}</p>
        </div>
        <div>
          <strong className="text-ivory block mb-1">Shipping & Tracking</strong>
          <p className="text-ivory">{order.shipping_address}</p>
          {order.courier_name && (
            <p className="text-muted font-num mt-1">Courier: {order.courier_name}</p>
          )}
          {order.tracking_number && (
            <p className="text-muted font-num">Tracking ID: {order.tracking_number}</p>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="space-y-3 border-t border-ivory/10 pt-4">
        <strong className="text-ivory text-xs uppercase block">Items</strong>
        {order.items && order.items.map((item) => (
          <div key={item.id} className="flex justify-between items-center text-xs p-2 rounded bg-obsidian border border-ivory/10">
            <div>
              <span className="font-bold text-ivory font-sans">{item.product_title}</span>
              <span className="text-muted block text-[10px]">{item.size_label} × {item.quantity}</span>
            </div>
            <span className="font-num font-bold text-ivory">{formatPrice(item.total)}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center text-sm font-bold text-ivory pt-3 border-t border-ivory/10">
        <span className="font-sans">Total Amount Paid</span>
        <span className="font-num text-xl text-ivory">{formatPrice(order.total_amount)}</span>
      </div>
    </div>
  );
}

function ActionRow({ orderNumber }) {
  return (
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
        <Truck className="w-4 h-4" /> Track order <ArrowRight className="w-4 h-4" />
      </Link>
      <Link
        to="/shop"
        className="text-xs text-muted hover:text-ivory uppercase tracking-wider flex items-center gap-2 py-3"
      >
        <ShieldCheck className="w-4 h-4" /> Continue shopping
      </Link>
    </div>
  );
}

/* Tiny local reveal (fade-up) so this page doesn't import the grid system */
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOn(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div ref={ref} className={`celebration-rise ${on ? 'is-on' : ''} ${className}`}>
      {children}
    </div>
  );
}
