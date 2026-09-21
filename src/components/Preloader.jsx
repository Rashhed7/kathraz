import React, { useEffect, useState } from 'react';

// Minimal opening: logo and wordmark fade in, overlay fades away. No glow,
// shimmer, or pulsing — the shop loads fast and the preloader stays quiet.
export default function Preloader() {
  const [phase, setPhase] = useState('show'); // show -> fade -> gone

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fade'), 900);
    const t2 = setTimeout(() => setPhase('gone'), 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase === 'gone') return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] bg-obsidian flex flex-col items-center justify-center transition-opacity duration-500 ${
        phase === 'fade' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <img
        src="/images/logo.png"
        alt=""
        className="pl-logo h-20 w-auto object-contain"
      />
      <p className="pl-wordmark font-cinzel text-xl font-semibold tracking-[0.45em] pl-[0.45em] mt-7 text-ivory">
        KATHRAZ
      </p>
      <p className="pl-sub text-[10px] tracking-[0.4em] pl-[0.4em] text-muted uppercase mt-2">
        Fragrances
      </p>
    </div>
  );
}
