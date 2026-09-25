import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export default function ProductCard({ product, onQuickView }) {
  const { formatPrice, addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const isLiked = isWishlisted(product.id);
  const defaultVariant = product.variants && product.variants.length > 0 ? product.variants[0] : { id: 1, size_label: '50ml', price: product.base_price, stock_quantity: 50 };

  return (
    <div className="group relative bg-card border border-ivory/10 hover:border-ivory/25 rounded-lg overflow-hidden transition-colors duration-300 flex flex-col justify-between">
      {/* Badge — one, quiet, text only */}
      {product.is_bestseller === 1 && (
        <span className="absolute top-3 left-3 z-10 text-[10px] uppercase tracking-widest text-ivory/70 bg-obsidian/90 px-2 py-1">
          Bestseller
        </span>
      )}

      {/* Wishlist — generous hit area for thumbs on touch screens */}
      <button
        onClick={() => toggleWishlist(product.id)}
        className={`absolute top-1.5 right-1.5 z-10 p-2.5 transition-colors ${
          isLiked ? 'text-gold' : 'text-ivory/40 hover:text-ivory'
        }`}
        aria-label={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
        title="Add to Wishlist"
      >
        <Heart className={`w-[18px] h-[18px] ${isLiked ? 'fill-current' : ''}`} />
      </button>

      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-charcoal/40 cursor-pointer">
        <Link to={`/product/${product.slug}`}>
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
          />
        </Link>

        {/* Quick view — always visible on touch (no hover), hover-reveal on desktop */}
        {onQuickView && (
          <button
            onClick={() => onQuickView(product)}
            className="absolute inset-x-4 bottom-4 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 bg-obsidian/95 text-ivory text-xs font-medium py-3 hover:bg-ivory hover:text-obsidian"
          >
            Quick View
          </button>
        )}
      </div>

      {/* Details */}
      <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3">
        <div>
          <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] text-muted">
            {product.category_name || product.concentration}
          </div>
          <Link to={`/product/${product.slug}`}>
            <h3 className="font-sans text-base sm:text-lg font-semibold text-ivory mt-0.5 leading-snug">
              {product.title}
            </h3>
          </Link>
          <p className="text-xs text-muted font-light line-clamp-1 mt-1 hidden sm:block">
            {product.subtitle}
          </p>
        </div>

        {/* Rating — small, single line */}
        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-muted">
          <Star className="w-3 h-3 text-gold fill-gold" />
          <span className="text-ivory/70">{product.avg_rating || '5.0'}</span>
          {product.review_count ? <span>({product.review_count})</span> : null}
        </div>

        {/* Price & Add */}
        <div className="pt-3 border-t border-ivory/10 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-sm sm:text-base font-medium text-ivory">
              {formatPrice(product.sale_price || product.base_price)}
            </span>
            {product.sale_price && (
              <span className="text-[10px] sm:text-xs text-muted line-through">
                {formatPrice(product.base_price)}
              </span>
            )}
          </div>

          <button
            onClick={() => addToCart(product, defaultVariant, 1)}
            className="text-[11px] sm:text-xs text-muted hover:text-ivory border border-ivory/15 hover:border-ivory/40 rounded px-2.5 sm:px-3 py-2 sm:py-1.5 transition-colors flex items-center gap-1 sm:gap-1.5 shrink-0"
            aria-label={`Add ${product.title} to bag`}
            title="Add to Bag"
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
