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

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32 text-center">
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

      {/* CATEGORY — editorial collection band */}
      <section className="border-y border-ivory/10 bg-charcoal/40 relative overflow-hidden">
        {/* Ghost wordmark for depth (decorative) */}
        <div
          aria-hidden="true"
          className="absolute -bottom-6 right-2 hidden lg:block select-none pointer-events-none font-sans font-semibold leading-none tracking-tight text-[130px] text-ivory/[0.035]"
        >
          KATHRAZ
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <Reveal variant="left" className="lg:col-span-7">
              <div className="flex items-center gap-4 mb-5">
                <span className="h-px w-10 bg-gold/60" aria-hidden="true" />
                <p className="text-[10px] uppercase tracking-[0.35em] text-gold">The Collection</p>
              </div>
              <h2 className="font-sans text-3xl sm:text-4xl lg:text-[42px] leading-[1.1] font-medium text-ivory">
                Personal Fragrances
              </h2>
              <p className="mt-5 text-sm sm:text-[15px] text-ivory/70 font-light leading-relaxed max-w-xl">
                Inspired interpretations of celebrated perfumes and original
                blends — extraits and attar oils for daily wear, in unisex
                compositions.
              </p>
              <Link
                to="/shop?category=personal-fragrances"
                className="group mt-9 inline-flex items-center gap-3 border border-gold/40 hover:border-gold bg-transparent px-7 py-3.5 text-[11px] uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-all duration-300"
              >
                Browse all fragrances
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Reveal>

            {/* Editorial stat strip — hairline-divided columns */}
            <Reveal variant="fade" delay={150} className="lg:col-span-5">
              <div className="grid grid-cols-3 border-y lg:border border-ivory/10 divide-x divide-ivory/10">
                {[
                  ['35%', 'Extrait concentration'],
                  ['2–4', 'Day delivery in India'],
                  ['COD', 'Available nationwide'],
                ].map(([num, label]) => (
                  <div key={label} className="py-8 sm:py-10 px-2 text-center">
                    <p className="font-num text-2xl sm:text-3xl font-medium text-ivory tracking-wide">{num}</p>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted mt-2.5 leading-relaxed px-1">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
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

      {/* AD SPOTLIGHT — admin-managed promo banners, between products and notes */}
      <div className="pt-24">
        <AdBanner />
      </div>

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
