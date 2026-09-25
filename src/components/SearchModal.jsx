import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { formatPrice } = useCart();

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (query.trim().length > 1) {
      const fetchResults = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
          if (res.ok) {
            const data = await res.json();
            setResults(data.products || []);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };

      const timer = setTimeout(fetchResults, 250);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
    }
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-obsidian/90 backdrop-blur-md flex items-start justify-center pt-[max(4.5rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] px-3 sm:px-4 animate-fadeIn">
      <div className="w-full max-w-2xl bg-card border border-gold/30 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 sm:space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-ivory/60 hover:text-ivory transition-colors p-2"
          aria-label="Close search"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 border-b border-gold/20 pb-4 pr-10">
          <Search className="w-5 h-5 sm:w-6 sm:h-6 text-gold shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by note (e.g. Oud, Saffron, Rose)..."
            inputMode="search"
            enterKeyHint="search"
            autoFocus
            className="w-full bg-transparent text-base sm:text-lg text-ivory placeholder-muted focus:outline-none font-sans tracking-wide"
          />
        </div>

        {/* Quick Tag Recommendations */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted uppercase tracking-wider font-semibold">Popular Notes:</span>
          {['Cambodian Oud', 'Persian Saffron', 'Damask Rose', 'Ambergris', 'Car Atmosphere'].map((tag) => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              className="px-3 py-1 rounded-full bg-white border border-gold/30 text-gold-light hover:border-gold hover:bg-gold/10 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="max-h-[55vh] sm:max-h-96 overflow-y-auto space-y-3 pr-1 overscroll-contain">
          {loading && (
            <div className="py-8 text-center text-muted text-sm flex items-center justify-center gap-2">
              Searching…
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <p className="text-center py-8 text-sm text-muted">No fragrances matched your query "{query}".</p>
          )}

          {!loading && results.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.slug}`}
              onClick={onClose}
              className="flex items-center gap-4 p-3 rounded-xl bg-obsidian/60 border border-gold/10 hover:border-gold/40 transition-all group"
            >
              <img
                src={product.image_url}
                alt={product.title}
                className="w-14 h-14 object-cover rounded-lg border border-gold/20"
              />
              <div className="flex-1">
                <h4 className="font-sans font-bold text-base text-ivory group-hover:text-muted transition-colors">
                  {product.title}
                </h4>
                <p className="text-xs text-muted truncate max-w-sm font-light">{product.subtitle}</p>
                <div className="flex items-center gap-3 mt-1 text-xs">
                  <span className="text-gold/90 font-medium">{product.concentration}</span>
                  <span className="text-muted">•</span>
                  <span className="font-num font-bold text-gold">{formatPrice(product.base_price)}</span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gold/40 group-hover:text-gold group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
