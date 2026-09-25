import { useLayoutEffect, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls the window to the top whenever the route path changes.
 *
 * React Router is an SPA: the browser keeps the scroll offset when the URL
 * changes, so a new page would open mid-scroll. Keyed on `pathname` only —
 * query-string updates (filters, ?category=…, ?query=…) must NOT yank the
 * user to the top while they're already on that page.
 *
 * useLayoutEffect runs before paint, so the jump never shows a flash of the
 * old position. index.css sets `scroll-behavior: smooth` on <html>, which
 * would otherwise animate the jump (and fight the page transition) — we
 * force an instant scroll for one frame, then restore smooth behavior so
 * in-page anchor scrolling still works.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  // The browser must not asynchronously restore the old scroll offset on
  // back/forward (it would race with our reset).
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useLayoutEffect(() => {
    const html = document.documentElement;
    const previous = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    requestAnimationFrame(() => {
      html.style.scrollBehavior = previous;
    });
  }, [pathname]);

  return null;
}
