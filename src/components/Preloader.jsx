import React, { useEffect, useState } from 'react';

/**
 * Opening sequence:
 *   1. KATHRAZ logo fades up
 *   2. A gold hairline extends outward
 *   3. KATHRAZ reveals with easing letter-spacing + a shimmer sweep
 *   4. Thin progress line completes, then the overlay fades away
 */
export default function Preloader() {
  const [phase, setPhase] = useState('show'); // show -> fade -> gone

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fade'), 2400);
    const t2 = setTimeout(() => setPhase('gone'), 3100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase === 'gone') return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] bg-obsidian flex flex-col items-center justify-center transition-opacity duration-700 ${
        phase === 'fade' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Soft amber glow breathing behind the logo */}
      <div className="pl-glow absolute rounded-full bg-gold/25 blur-3xl" />

      {/* Brand logo */}
      <img
        src="/images/logo.png"
        alt=""
        className="pl-logo relative h-20 w-auto object-contain"
      />

      {/* Wordmark — Cinzel, letter-spacing eases in, shimmer sweep */}
      <p className="pl-wordmark font-cinzel text-xl font-semibold tracking-[0.45em] pl-[0.45em] mt-7">
        KATHRAZ
      </p>
      <p className="pl-sub text-[10px] tracking-[0.4em] pl-[0.4em] text-muted uppercase mt-2">
        Fragrances
      </p>

      {/* Three pulsing dots */}
      <div className="pl-dots mt-8 flex items-center gap-2">
        <span className="pl-dot h-1.5 w-1.5 rounded-full bg-gold" style={{ animationDelay: '0s' }} />
        <span className="pl-dot h-1.5 w-1.5 rounded-full bg-gold" style={{ animationDelay: '0.25s' }} />
        <span className="pl-dot h-1.5 w-1.5 rounded-full bg-gold" style={{ animationDelay: '0.5s' }} />
      </div>
    </div>
  );
}
