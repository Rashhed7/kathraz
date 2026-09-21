import React, { useEffect, useRef, useState } from 'react';

/**
 * Scroll-reveal system — the site's single animation primitive.
 *
 * Wraps children and fades/slides them in the first time they enter the
 * viewport. Built on IntersectionObserver (no library), so it costs nothing
 * on scroll and respects prefers-reduced-motion.
 *
 * Usage:
 *   <Reveal>...</Reveal>                    // fade-up
 *   <Reveal variant="fade" delay={150}>...  // fade only, 150ms late
 *   <Reveal as="li" delay={i * 80}>...      // staggered list items
 *
 * Variants: fade | up (default) | left | right | scale
 */
export default function Reveal({
  children,
  variant = 'up',
  delay = 0,
  as: Tag = 'div',
  className = '',
  once = true,
  ...rest
}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    // Reduced motion or no observer support: show immediately, animate nothing
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return undefined;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            if (once) io.unobserve(entry.target);
          } else if (!once) {
            setShown(false);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  return (
    <Tag
      ref={ref}
      data-reveal={variant}
      className={`reveal ${shown ? 'is-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
