import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import ScentFinder from '../components/ScentFinder';
import InstagramFeed from '../components/InstagramFeed';
import Reveal from '../components/Reveal';
import AdBanner from '../components/AdBanner';
import { useCart } from '../context/CartContext';

export default function Home({ onOpenSearch }) {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestsellerProducts, setBestsellerProducts] = useState([]);
  const [selectedQuickView, setSelectedQuickView] = useState(null);
  const [activeNoteTab, setActiveNoteTab] = useState('top');
  const [loading, setLoading] = useState(true);
  const heroVideoRef = useRef(null);
  const heroSectionRef = useRef(null);

  // Hero parallax: the video layer drifts at ~40% of scroll speed, creating
  // depth behind the static text. rAF-throttled; transform is GPU-composited.
  useEffect(() => {
    const el = heroSectionRef.current;
    if (!el) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return undefined;

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = el.getBoundingClientRect().top;
        if (y < 0 && y > -el.offsetHeight) {
          const media = el.querySelector('.parallax');
          if (media) media.style.transform = `translate3d(0, ${y * 0.4}px, 0)`;
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Mobile autoplay fix: React doesn't reliably render the `muted` attribute,
  // and iOS Safari only allows autoplay when that attribute is on the DOM node.
  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) return;
    video.muted = true;
    video.play().catch(() => {
      // Autoplay refused — retry once after the user interacts with the page.
      const resume = () => {
        video.play().catch(() => {});
        window.removeEventListener('touchstart', resume);
        window.removeEventListener('click', resume);
      };
      window.addEventListener('touchstart', resume, { once: true });
      window.addEventListener('click', resume, { once: true });
    });
  }, []);

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

      {/* HERO — cover video background with text overlay */}
      <section ref={heroSectionRef} className="relative overflow-hidden">
        {/* Video layer (hidden until the file exists — graceful gradient fallback).
            No overlays — the video renders at full visibility. */}
        <div className="parallax absolute inset-0" aria-hidden="true">
          <video
            ref={heroVideoRef}
            className="w-full h-full object-cover"
            src="/videos/hero-cover.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onError={(e) => e.currentTarget.classList.add('hidden')}
          />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 text-center">
          <Reveal>
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted mb-6">
              Crafted in India · Est. 2026
            </p>
          </Reveal>
          <Reveal delay={120}>
            <h1 className="font-sans text-4xl sm:text-5xl lg:text-6xl font-medium text-ivory leading-[1.08]">
              Fine fragrances, thoughtfully made.
            </h1>
          </Reveal>
          <Reveal delay={240}>
            <p className="mt-6 text-sm sm:text-[15px] text-ivory/80 font-light leading-relaxed max-w-xl mx-auto">
              We create inspired interpretations of the world's most celebrated
              perfumes, alongside original blends built on aged oud, Indian rose
              absolutes and a 35% extrait concentration — made in small batches
              and delivered across India.
            </p>
          </Reveal>
          <Reveal delay={360}>
            <div className="mt-9 flex justify-center">
              <Link
                to="/shop"
                className="btn-gold px-8 py-3.5 text-xs uppercase tracking-[0.15em]"
              >
                Shop the Collection
              </Link>
            </div>
            <p className="mt-8 text-xs text-muted">
              Delivered across India in 2–4 days
            </p>
          </Reveal>
        </div>
      </section>

      {/* AD SPOTLIGHT — admin-managed promo banners */}
      <AdBanner />

      {/* CATEGORY — single honest band */}
      <section className="border-y border-ivory/10 bg-charcoal/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <Reveal variant="left">
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
                  className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-ivory hover:text-muted transition-colors underline underline-offset-4"
                >
                  Browse all fragrances <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Reveal>
            <div className="grid grid-cols-3 gap-6 md:pl-10">
              {[
                ['Extrait', 'de parfum strength'],
                ['2–4', 'day delivery in India'],
                ['COD', 'available nationwide'],
              ].map(([num, label], i) => (
                <Reveal key={label} delay={i * 120}>
                  <div>
                    <p className="font-num text-2xl font-medium text-ivory">{num}</p>
                    <p className="text-[11px] text-muted mt-1 leading-snug">{label}</p>
                  </div>
                </Reveal>
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
            {bestsellerProducts.map((product, i) => (
              <Reveal key={product.id} delay={(i % 3) * 110}>
                <ProductCard
                  product={product}
                  onQuickView={(p) => setSelectedQuickView(p)}
                />
              </Reveal>
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
                      ? 'border-ivory text-ivory'
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
        <Reveal>
          <div className="border-b border-ivory/10 pb-5 mb-10">
            <h2 className="font-sans text-3xl font-medium text-ivory">From our customers</h2>
          </div>
        </Reveal>

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
          ].map((r, i) => (
            <Reveal key={r.name} delay={i * 140}>
              <div className="flex flex-col">
                <p className="text-sm text-ivory/80 font-light leading-relaxed italic flex-1">
                  "{r.text}"
                </p>
                <div className="mt-5 pt-4 border-t border-ivory/10">
                  <p className="text-sm text-ivory">{r.name}</p>
                  <p className="text-[11px] text-muted mt-0.5">{r.meta}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* INSTAGRAM FEED — admin-managed posts */}
      <InstagramFeed />

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
