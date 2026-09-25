import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders overlay content (modals/drawers) into document.body via a portal.
 *
 * Why: `position: fixed` only anchors to the viewport when no ancestor has a
 * transform, filter, or will-change. On this site, overlays like
 * QuickViewModal render inside <PageTransition>'s .animate-pageIn wrapper and
 * often under <Reveal> (will-change: transform). Any such ancestor becomes
 * the containing block, so `fixed inset-0` no longer covers the viewport —
 * the modal opens offset by the page's current scroll position (wrong view),
 * which is exactly the reported bug.
 *
 * Portaling to <body> (which has no transform) restores correct fixed
 * positioning everywhere, on desktop and mobile.
 */
export default function OverlayPortal({ children }) {
  // Portals need a DOM node on first client render; guarding with mounted
  // state keeps SSR/hydration-safe behavior and avoids null-target races.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(children, document.body);
}
