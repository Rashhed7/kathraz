import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

/**
 * Ad spotlight — full-width promotional banners directly below the hero.
 * Ads are uploaded by the admin (Admin -> Ads): wide photo + optional
 * headline, subtext and link. Auto-advances every 6s, pauses on hover,
 * manual arrows and dots. Hidden entirely when no active ads exist.
 * A single ad renders as a static banner (no controls).
 */
const ADVANCE_MS = 6000;

export default function AdBanner() {
  const [ads, setAds] = useState([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const fetchAds = async () => {
      try {
        const res = await fetch('/api/ads');
        if (res.ok && !cancelled) {
          const data = await res.json();
          setAds(data.ads || []);
        }
      } catch (e) {
        // Spotlight stays hidden on failure — the page must not break
      }
    };
    fetchAds();
    return () => { cancelled = true; };
  }, []);

  const next = useCallback(() => setIndex((i) => (i + 1) % ads.length), [ads.length]);
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + ads.length) % ads.length),
    [ads.length]
  );

  // Auto-advance (skipped for reduced-motion visitors)
  useEffect(() => {
    if (ads.length < 2 || paused) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return undefined;

    timerRef.current = setInterval(next, ADVANCE_MS);
    return () => clearInterval(timerRef.current);
  }, [ads.length, paused, next]);

  if (ads.length === 0) return null;

  const single = ads.length === 1;

  return (
    <section
      className="relative w-full overflow-hidden bg-ivory"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Promotions"
    >
      <div
        className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {ads.map((ad) => {
          const Inner = (
            <>
              <img
                src={ad.image_url}
                alt={ad.headline || 'Promotion'}
                loading={index === 0 ? 'eager' : 'lazy'}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Bottom scrim only — keeps overlay text readable without
                  washing out the ad photo */}
              <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ivory/60 to-transparent pointer-events-none" />

              {(ad.headline || ad.subtext) && (
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 lg:p-14">
                  {ad.headline && (
                    <h2 className="font-sans text-obsidian text-2xl sm:text-4xl lg:text-5xl font-medium tracking-tight max-w-2xl leading-[1.1]">
                      {ad.headline}
                    </h2>
                  )}
                  {ad.subtext && (
                    <p className="mt-2 sm:mt-3 text-obsidian/85 text-xs sm:text-sm font-light max-w-xl leading-relaxed">
                      {ad.subtext}
                    </p>
                  )}
                  {ad.link_url && (
                    <span className="mt-4 sm:mt-5 inline-flex items-center gap-2 bg-obsidian text-obsidian text-[10px] sm:text-[11px] uppercase tracking-[0.15em] font-semibold px-5 sm:px-6 py-2.5 sm:py-3">
                      Shop now <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              )}
            </>
          );

          return (
            <div key={ad.id} className="relative w-full shrink-0 aspect-[21/9] sm:aspect-[2.6/1]">
              {ad.link_url ? (
                <a
                  href={ad.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 block"
                >
                  {Inner}
                </a>
              ) : (
                <div className="absolute inset-0">{Inner}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Controls */}
      {!single && (
        <>
          <button
            onClick={prev}
            aria-label="Previous promotion"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-obsidian/70 text-obsidian hover:bg-obsidian transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            aria-label="Next promotion"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-obsidian/70 text-obsidian hover:bg-obsidian transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute bottom-3 right-4 sm:right-6 z-10 flex items-center gap-1.5">
            {ads.map((ad, i) => (
              <button
                key={ad.id}
                onClick={() => setIndex(i)}
                aria-label={`Go to promotion ${i + 1}`}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === index ? 'w-6 bg-obsidian' : 'w-2.5 bg-obsidian/40 hover:bg-obsidian/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
