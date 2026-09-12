import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import ScentFinder from '../components/ScentFinder';
import { useCart } from '../context/CartContext';

export default function Home({ onOpenSearch }) {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestsellerProducts, setBestsellerProducts] = useState([]);
  const [selectedQuickView, setSelectedQuickView] = useState(null);
  const [activeNoteTab, setActiveNoteTab] = useState('top');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        const prods = data.products || [];
        setFeaturedProducts(prods.filter(p => p.is_featured === 1));
        setBestsellerProducts(prods.filter(p => p.is_bestseller === 1));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24">

      {/* HERO — clean, text-only */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-28 text-center">
        <p className="text-[11px] uppercase tracking-[0.25em] text-muted mb-6">
          Crafted in India · Est. 2026
        </p>
        <h1 className="font-sans text-4xl sm:text-5xl lg:text-6xl font-medium text-ivory leading-[1.08]">
          Fine fragrances, thoughtfully made.
        </h1>
        <p className="mt-6 text-sm sm:text-[15px] text-ivory/70 font-light leading-relaxed max-w-xl mx-auto">
          We create inspired interpretations of the world's most celebrated
          perfumes, alongside original blends built on aged oud, Indian rose
          absolutes and a 35% extrait concentration — made in small batches
          and delivered across India.
        </p>
        <div className="mt-9 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            to="/shop"
            className="btn-gold px-8 py-3.5 text-xs uppercase tracking-[0.15em]"
          >
            Shop the Collection
          </Link>
          <Link
            to="/about"
            className="btn-outline-gold px-8 py-3.5 text-xs uppercase tracking-[0.15em]"
          >
            How We Make It
          </Link>
        </div>
        <p className="mt-8 text-xs text-muted">
          Ships across India in 2–4 days · Free above ₹5,000
        </p>
      </section>

      {/* CATEGORY — single honest band */}
      <section className="border-y border-ivory/10 bg-charcoal/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-muted mb-3">The Collection</p>
              <h2 className="font-sans text-3xl font-medium text-ivory">Personal Fragrances</h2>
            <p className="mt-4 text-sm text-ivory/70 font-light leading-relaxed max-w-md">
              Inspired interpretations of celebrated perfumes and original
              blends — extraits and attar oils for daily wear, in unisex
              compositions.
            </p>
              <Link
                to="/shop?category=personal-fragrances"
                className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-gold hover:text-gold-light transition-colors"
              >
                Browse all fragrances <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-6 md:pl-10">
              {[
                ['35%', 'extrait concentration'],
                ['12+', 'hours on skin'],
                ['2–4', 'day delivery, all India'],
              ].map(([num, label]) => (
                <div key={label}>
                  <p className="font-num text-2xl font-medium text-ivory">{num}</p>
                  <p className="text-[11px] text-muted mt-1 leading-snug">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SCENT FINDER */}
      <section className="max-w-5xl mx-auto px-4 pt-20">
        <ScentFinder
          products={[...featuredProducts, ...bestsellerProducts]}
          onSelectProduct={(p) => setSelectedQuickView(p)}
        />
      </section>

      {/* BEST SELLERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <div className="flex items-end justify-between border-b border-ivory/10 pb-5 mb-10">
          <h2 className="font-sans text-3xl font-medium text-ivory">Bestsellers</h2>
          <Link
            to="/shop"
            className="text-xs uppercase tracking-[0.15em] text-muted hover:text-ivory transition-colors"
          >
            View all
          </Link>
        </div>

        {loading ? (
          <div className="py-20 text-center text-muted text-sm">Loading…</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bestsellerProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={(p) => setSelectedQuickView(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* NOTES — quiet explainer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted mb-3">Construction</p>
            <h2 className="font-sans text-3xl font-medium text-ivory">How it develops</h2>
            <p className="mt-4 text-sm text-ivory/70 font-light leading-relaxed">
              Each composition unfolds in three stages as it warms on skin.
              What you smell at first spray is not what you'll smell at midnight —
              that's the point.
            </p>

            <div className="mt-8 space-y-1">
              {[
                ['top', 'Top', 'first 30 minutes'],
                ['heart', 'Heart', 'hours 1–4'],
                ['base', 'Base', 'hours 4–16'],
              ].map(([key, label, when]) => (
                <button
                  key={key}
                  onClick={() => setActiveNoteTab(key)}
                  className={`w-full text-left px-4 py-3 flex items-baseline justify-between border-l-2 transition-colors ${
                    activeNoteTab === key
                      ? 'border-gold text-ivory'
                      : 'border-ivory/10 text-muted hover:text-ivory'
                  }`}
                >
                  <span className="font-sans text-lg">{label} notes</span>
                  <span className="text-[11px]">{when}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8 bg-card border border-ivory/10 p-8 sm:p-12">
            {activeNoteTab === 'top' && (
              <div className="animate-fadeIn">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted">First 30 minutes</p>
                <h3 className="font-sans text-2xl text-ivory mt-2">Saffron, bergamot, cardamom</h3>
                <p className="mt-5 text-sm text-ivory/70 font-light leading-relaxed max-w-xl">
                  Kashmiri saffron opens bright and slightly bitter, softened by
                  Sicilian bergamot. Guatemalan cardamom gives it a green,
                  almost eucalyptus edge in the first minutes.
                </p>
              </div>
            )}
            {activeNoteTab === 'heart' && (
              <div className="animate-fadeIn">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Hours 1–4</p>
                <h3 className="font-sans text-2xl text-ivory mt-2">Taif rose, Cambodian oud, jasmine</h3>
                <p className="mt-5 text-sm text-ivory/70 font-light leading-relaxed max-w-xl">
                  The core of the fragrance. Rose absolute from Taif carries a
                  honeyed darkness that pairs with the resinous, medicinal
                  depth of 25-year aged oud. Jasmine sambac rounds the edges.
                </p>
              </div>
            )}
            {activeNoteTab === 'base' && (
              <div className="animate-fadeIn">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Hours 4–16</p>
                <h3 className="font-sans text-2xl text-ivory mt-2">Amber, leather, patchouli</h3>
                <p className="mt-5 text-sm text-ivory/70 font-light leading-relaxed max-w-xl">
                  What remains on fabric the next morning. Baltic amber resin
                  and a quiet leather accord, grounded with dark patchouli and
                  Mysore-style sandalwood.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* REVIEWS — restrained, plausible */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <div className="border-b border-ivory/10 pb-5 mb-10">
          <h2 className="font-sans text-3xl font-medium text-ivory">From our customers</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              text: "I've worn Tom Ford's Oud Wood for years. This is denser and lasts twice as long on me. The saffron opening took a few wears to get used to, but now it's the part I look forward to.",
              name: 'Rohan M.',
              meta: 'Oud Royal · Verified buyer',
            },
            {
              text: 'Bought the 50ml for my wife in December. The rose is genuinely good — not the soapy synthetic kind. She has already asked for the 100ml.',
              name: 'Arjun K.',
              meta: 'Velvet Rose & Amber · Verified buyer',
            },
            {
              text: 'Two sprays at 7am were still there when I got home at 10pm. One bottle lasts me months at this concentration.',
              name: 'Sana P.',
              meta: 'Saffron Imperial · Verified buyer',
            },
          ].map((r) => (
            <div key={r.name} className="flex flex-col">
              <p className="text-sm text-ivory/80 font-light leading-relaxed italic flex-1">
                "{r.text}"
              </p>
              <div className="mt-5 pt-4 border-t border-ivory/10">
                <p className="text-sm text-ivory">{r.name}</p>
                <p className="text-[11px] text-muted mt-0.5">{r.meta}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick View Modal */}
      {selectedQuickView && (
        <QuickViewModal
          product={selectedQuickView}
          onClose={() => setSelectedQuickView(null)}
        />
      )}
    </div>
  );
}
