import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, Grid, List, Search, X, Heart } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import Reveal from '../components/Reveal';
import QuickViewModal from '../components/QuickViewModal';
import { useWishlist } from '../context/WishlistContext';

// The shop's default view (no ?category=) is the fragrance range, so non-perfume
// products never sit under an "All Fragrances" heading. If you open more
// fragrance categories later, add their slugs here — they join "All Fragrances"
// and drop out of the sidebar list (which shows the other ranges).
const FRAGRANCE_CATEGORY_SLUGS = ['personal-fragrances'];

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuickView, setSelectedQuickView] = useState(null);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedConcentration, setSelectedConcentration] = useState('');
  const [maxPrice, setMaxPrice] = useState(25000);
  const [sortBy, setSortBy] = useState('recommended');
  const [viewMode, setViewMode] = useState('grid');
  const [showWishlistOnly, setShowWishlistOnly] = useState(searchParams.get('wishlist') === 'true');
  const [showFilters, setShowFilters] = useState(false);

  // Active filter count for the mobile filters button
  const activeFilterCount = [
    selectedCategory,
    selectedGender,
    selectedConcentration,
    searchQuery,
    maxPrice < 25000 ? 'price' : '',
  ].filter(Boolean).length;

  const { wishlist } = useWishlist();

  // Which categories count as "fragrances" right now. If the admin renames or
  // deletes the configured category, fall back to the unfiltered listing
  // (headed "All Products") instead of rendering an empty shop.
  const activeFragranceSlugs = categories.length === 0
    ? FRAGRANCE_CATEGORY_SLUGS
    : FRAGRANCE_CATEGORY_SLUGS.filter((s) => categories.some((c) => c.slug === s));
  const effectiveCategory = selectedCategory || activeFragranceSlugs.join(',');
  const isFragranceView = !selectedCategory && activeFragranceSlugs.length > 0;

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery, selectedGender, selectedConcentration, maxPrice, sortBy]);

  // Sync filters when the URL changes (e.g. nav links to /shop?category=... or /shop?wishlist=true)
  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || '');
    setShowWishlistOnly(searchParams.get('wishlist') === 'true');
  }, [searchParams]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/products/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `/api/products?maxPrice=${maxPrice}&sort=${sortBy}`;
      if (effectiveCategory) url += `&category=${encodeURIComponent(effectiveCategory)}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (selectedGender) url += `&gender=${selectedGender}`;
      if (selectedConcentration) url += `&concentration=${encodeURIComponent(selectedConcentration)}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSelectedCategory('');
    setSearchQuery('');
    setSelectedGender('');
    setSelectedConcentration('');
    setMaxPrice(25000);
    setSortBy('recommended');
    setShowWishlistOnly(false);
    setSearchParams({});
  };

  const displayedProducts = showWishlistOnly
    ? products.filter(p => wishlist.includes(p.id))
    : products;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-10 space-y-6">
      {/* Page title — deliberately one line. The old banner card pushed the
          whole product grid below the fold, so the copy moved into the filter
          sidebar and the result count moved up here. */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="font-sans text-xl sm:text-2xl font-bold text-ivory">
          {selectedCategory
            ? categories.find(c => c.slug === selectedCategory)?.name || 'Collection'
            : isFragranceView ? 'All Fragrances' : 'All Products'}
        </h1>
        <span className="text-xs text-muted font-num">
          {loading
            ? 'Loading…'
            : `${displayedProducts.length} ${displayedProducts.length === 1 ? 'product' : 'products'}`}
        </span>
        {showWishlistOnly && (
          <span className="text-[10px] uppercase tracking-wider text-gold font-semibold">Wishlist</span>
        )}
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Filters Sidebar — full-width collapsible panel on mobile, sticky rail on desktop */}
        <aside
          className={`${
            showFilters ? 'block' : 'hidden'
          } lg:block lg:col-span-3 bg-card border border-gold/20 rounded-2xl px-5 py-5 sm:p-6 space-y-6 glass-panel lg:sticky lg:top-24`}
        >
          <div className="flex items-center justify-between border-b border-gold/15 pb-4">
            <div className="flex items-center gap-2 font-sans font-bold text-sm text-ivory">
              <SlidersHorizontal className="w-4 h-4 text-ivory" /> Filters
            </div>
            <button
              onClick={resetFilters}
              className="text-[11px] text-gold/80 hover:text-gold underline"
            >
              Reset All
            </button>
          </div>

          {/* Search Field */}
          <div className="space-y-2">
            <label className="text-xs text-muted font-semibold uppercase tracking-wider block">Search Note / Name</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Oud, Saffron, Rose..."
                className="w-full bg-obsidian border border-gold/30 text-xs text-ivory p-2.5 pl-8 rounded-lg focus:outline-none focus:border-gold"
              />
              <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-3" />
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <label className="text-xs text-muted font-semibold uppercase tracking-wider block">Categories</label>
            <div className="space-y-1 text-xs">
              <button
                onClick={() => setSelectedCategory('')}
                className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === '' ? 'bg-gold/20 text-gold border border-gold/30' : 'text-ivory/80 hover:bg-gold/10'
                }`}
              >
                {isFragranceView ? 'All Fragrances' : 'All Products'}
              </button>
              {categories
                .filter((cat) => !activeFragranceSlugs.includes(cat.slug))
                .map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
                      selectedCategory === cat.slug ? 'bg-gold/20 text-gold border border-gold/30' : 'text-ivory/80 hover:bg-gold/10'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
            </div>
          </div>

          {/* Gender Filter */}
          <div className="space-y-2">
            <label className="text-xs text-muted font-semibold uppercase tracking-wider block">Gender Profile</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {['', 'Unisex', 'For Him', 'For Her'].map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGender(g)}
                  className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
                    selectedGender === g ? 'bg-gold/20 border-gold text-gold font-bold' : 'border-gold/20 text-muted hover:text-ivory'
                  }`}
                >
                  {g || 'All'}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-3 pt-2 border-t border-gold/15">
            <div className="flex justify-between text-xs">
              <span className="text-muted font-semibold uppercase">Max Price</span>
              <span className="text-gold font-num font-bold">₹{maxPrice.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="2000"
              max="25000"
              step="1000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-gold cursor-pointer h-6 bg-transparent"
            />
          </div>

          {/* Wishlist Toggle */}
          <div className="pt-2 border-t border-gold/15">
            <button
              onClick={() => setShowWishlistOnly(!showWishlistOnly)}
              className={`w-full p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                showWishlistOnly ? 'bg-gold text-charcoal border-gold shadow-lg' : 'border-gold/30 text-gold hover:bg-gold/10'
              }`}
            >
              <Heart className={`w-4 h-4 ${showWishlistOnly ? 'fill-current' : ''}`} />
              {showWishlistOnly ? 'Showing Wishlist Only' : `Wishlist Saved (${wishlist.length})`}
            </button>
          </div>

          {/* Brand note — relocated from the old page banner so it stays on the
              page without competing with the products for the top of the screen */}
          <p className="pt-1 text-[10px] leading-relaxed text-muted font-light">
            Extrait de parfums and attar oils, blended and bottled in small batches.
          </p>
        </aside>

        {/* Product Grid Area */}
        <main className="lg:col-span-9 space-y-6">
          {/* Toolbar — a single row. The product count moved up into the page
              title, so this no longer stacks two rows above the grid. */}
          <div className="bg-card border border-gold/20 rounded-xl p-3 sm:p-4 flex items-center gap-3">
            {/* Mobile: collapsible filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
              className={`lg:hidden shrink-0 flex items-center gap-1.5 text-xs font-medium px-3.5 py-2.5 rounded-lg border transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'bg-gold/20 border-gold/40 text-gold'
                  : 'border-gold/30 text-muted hover:text-ivory'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>

            {/* Sort By Dropdown — native picker on mobile, thumb-reachable */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 bg-obsidian border border-gold/30 text-xs text-ivory px-3 py-2.5 rounded-lg focus:outline-none focus:border-gold"
            >
              <option value="recommended">Sort by: Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest Additions</option>
            </select>
          </div>

          {/* Products Loading / Empty State */}
          {loading ? (
            <div className="py-24 text-center text-muted text-sm">
              Loading…
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="text-center py-20 bg-card border border-gold/20 rounded-2xl space-y-4">
              <p className="text-sm text-muted">No fragrances match your filters.</p>
              <button
                onClick={resetFilters}
                className="btn-gold px-6 py-2.5 rounded-lg text-xs uppercase font-bold tracking-wider"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {displayedProducts.map((product, i) => (
                <Reveal key={product.id} delay={(i % 3) * 90} variant="fade">
                  <ProductCard
                    product={product}
                    onQuickView={(p) => setSelectedQuickView(p)}
                  />
                </Reveal>
              ))}
            </div>
          )}
        </main>
      </div>

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
