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
      {/* Brand logo */}
      <img
        src="/images/logo.png"
        alt=""
        className="pl-logo h-20 w-auto object-contain"
      />

      {/* Hairline */}
      <div className="pl-hairline h-px w-40 bg-gold/60 my-7" />

      {/* Wordmark — Cinzel, letter-spacing eases in, shimmer sweep */}
      <p className="pl-wordmark font-cinzel text-xl font-semibold tracking-[0.45em] pl-[0.45em]">
        KATHRAZ
      </p>
      <p className="pl-sub text-[10px] tracking-[0.4em] pl-[0.4em] text-muted uppercase mt-2">
        Fragrances
      </p>

      {/* Progress line */}
      <div className="mt-8 h-px w-48 bg-ivory/10 overflow-hidden">
        <div className="pl-progress h-full w-full bg-gold origin-left" />
      </div>
    </div>
  );
}
