import { useEffect } from 'react';

/**
 * Locks body scroll while an overlay (drawer/modal) is open.
 *
 * Two layers of defense for iOS Safari, where `overflow:hidden` on <body>
 * alone is not reliable:
 *   1. `overflow:hidden` — handles normal browsers (Android Chrome, desktop).
 *   2. `position:fixed; top:-scrollY` — the classic iOS trick: freeze the page
 *      at its current scroll offset. On cleanup the offset is restored.
 *
 * Usage:  useBodyScrollLock(isOpen);
 */
export default function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked) return undefined;

    const { body } = document;
    const scrollY = window.scrollY;
    const hadOverflow = body.style.overflow;
    const hadPosition = body.style.position;
    const hadTop = body.style.top;
    const hadWidth = body.style.width;
    const hadLeft = body.style.left;
    const hadRight = body.style.right;

    body.classList.add('mobile-scroll-locked');
    body.style.top = `-${scrollY}px`;

    return () => {
      body.classList.remove('mobile-scroll-locked');
      body.style.overflow = hadOverflow;
      body.style.position = hadPosition;
      body.style.top = hadTop;
      body.style.width = hadWidth;
      body.style.left = hadLeft;
      body.style.right = hadRight;
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}
