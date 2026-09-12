import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PHONE_DISPLAY, EMAIL_ADDRESS } from '../config/contact';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-obsidian border-t border-ivory/10 pt-14 pb-10 text-ivory/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <img src="/images/logo.png" alt="KATHRAZ" className="h-10 w-auto object-contain" />
              <span className="font-cinzel text-xl font-semibold tracking-[0.3em] text-ivory">KATHRAZ</span>
            </div>
            <p className="text-xs text-muted leading-relaxed font-light max-w-xs">
              A fragrance house blending India's attar distillation tradition
              with French perfumery. Aged oud, rose absolutes, and
              extrait-strength compositions in small batches.
            </p>
            <p className="text-[11px] text-muted tracking-[0.2em] uppercase">
              Made in India
            </p>
            <a
              href={`mailto:${EMAIL_ADDRESS}`}
              className="text-xs text-muted hover:text-ivory transition-colors inline-flex items-center gap-1.5"
            >
              {EMAIL_ADDRESS}
            </a>
          </div>

          {/* Collections */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-muted">Shop</h3>
            <ul className="space-y-2 text-xs font-light">
              <li><Link to="/shop?category=personal-fragrances" className="hover:text-ivory transition-colors">Extrait de Parfum</Link></li>
              <li><Link to="/shop?bestseller=true" className="hover:text-ivory transition-colors">Bestsellers</Link></li>
              <li><Link to="/shop" className="hover:text-ivory transition-colors">All Fragrances</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-muted">Help</h3>
            <ul className="space-y-2 text-xs font-light">
              <li><Link to="/track-order" className="hover:text-ivory transition-colors">Track an Order</Link></li>
              <li><Link to="/faq" className="hover:text-ivory transition-colors">FAQ & Shipping</Link></li>
              <li><Link to="/contact" className="hover:text-ivory transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-4 space-y-4">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-muted">Newsletter</h3>
            <p className="text-xs text-muted font-light leading-relaxed">
              Batch releases and restocks, a few times a year. No more than
              that — we don't write often.
            </p>

            {subscribed ? (
              <p className="text-xs text-ivory border border-ivory/15 bg-charcoal/50 px-3 py-2.5">
                Thank you — you're on the list.
              </p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="bg-transparent border border-ivory/20 border-r-0 text-ivory placeholder-muted text-xs px-3 py-2.5 focus:outline-none focus:border-ivory/50 flex-1 min-w-0"
                />
                <button
                  type="submit"
                  className="btn-gold px-5 py-2.5 text-xs uppercase tracking-[0.15em] whitespace-nowrap"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom line */}
        <div className="mt-12 pt-6 border-t border-ivory/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-muted">
          <p>© {new Date().getFullYear()} KATHRAZ Fragrances. All rights reserved.</p>
          <p>We deliver across India · Questions? {PHONE_DISPLAY}</p>
        </div>
      </div>
    </footer>
  );
}
