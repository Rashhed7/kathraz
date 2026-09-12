import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, Grid, List, Search, X, Heart } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import { useWishlist } from '../context/WishlistContext';

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

  const { wishlist } = useWishlist();

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
      if (selectedCategory) url += `&category=${selectedCategory}`;
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="relative rounded-2xl bg-card border border-gold/20 p-8 sm:p-12 overflow-hidden shadow-2xl glass-panel">
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="text-xs uppercase tracking-[0.25em] text-gold font-semibold flex items-center gap-1">
            KATHRAZ Parfumerie Treasury
          </span>
          <h1 className="font-cinzel text-3xl sm:text-4xl font-bold text-ivory">
            {selectedCategory ? categories.find(c => c.slug === selectedCategory)?.name || 'Collection' : 'All Fragrances'}
          </h1>
          <p className="text-xs text-muted font-light leading-relaxed">
            Browse our master-blended extrait de parfums, rare attar oils, and bespoke vehicle atmospheres.
          </p>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-3 bg-card border border-gold/20 rounded-2xl p-6 space-y-6 glass-panel sticky top-24">
          <div className="flex items-center justify-between border-b border-gold/15 pb-4">
            <div className="flex items-center gap-2 font-cinzel font-bold text-sm text-ivory">
              <SlidersHorizontal className="w-4 h-4 text-gold" /> Filter Library
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
                All Collections
              </button>
              {categories.map((cat) => (
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
          <div className="space-y-2 pt-2 border-t border-gold/15">
            <div className="flex justify-between text-xs">
              <span className="text-muted font-semibold uppercase">Max Price</span>
              <span className="text-gold font-serif font-bold">₹{maxPrice.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="2000"
              max="25000"
              step="1000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-gold cursor-pointer"
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
        </aside>

        {/* Product Grid Area */}
        <main className="lg:col-span-9 space-y-6">
          {/* Top Sort & View Bar */}
          <div className="bg-card border border-gold/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-muted">
              Showing <strong className="text-gold">{displayedProducts.length}</strong> creations
            </span>

            <div className="flex items-center gap-4">
              {/* Sort By Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-obsidian border border-gold/30 text-xs text-ivory px-3 py-2 rounded-lg focus:outline-none focus:border-gold"
              >
                <option value="recommended">Sort by: Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest Additions</option>
              </select>
            </div>
          </div>

          {/* Products Loading / Empty State */}
          {loading ? (
            <div className="py-24 text-center text-gold text-sm animate-pulse">
              Loading
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="text-center py-20 bg-card border border-gold/20 rounded-2xl space-y-4">
              <p className="text-sm text-muted">No fragrances found matching your selected filters.</p>
              <button
                onClick={resetFilters}
                className="btn-gold px-6 py-2.5 rounded-lg text-xs uppercase font-bold tracking-wider"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={(p) => setSelectedQuickView(p)}
                />
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
