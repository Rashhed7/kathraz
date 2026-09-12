import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Star, ShoppingBag, Heart, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export default function QuickViewModal({ product, onClose }) {
  const { formatPrice, addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [selectedVariant, setSelectedVariant] = useState(
    product?.variants && product.variants.length > 0 ? product.variants[0] : null
  );
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const isLiked = isWishlisted(product.id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-obsidian/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-3xl bg-card border border-gold/30 rounded-2xl overflow-hidden shadow-2xl relative grid grid-cols-1 md:grid-cols-2">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-ivory/60 hover:text-gold transition-colors p-2 bg-obsidian/60 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Image */}
        <div className="relative aspect-square bg-obsidian">
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right Info */}
        <div className="p-6 md:p-8 flex flex-col justify-between space-y-4 max-h-[85vh] overflow-y-auto">
          <div>
            <span className="text-xs uppercase tracking-widest text-gold font-medium">
              {product.concentration}
            </span>
            <h2 className="font-serif text-2xl font-bold text-ivory mt-1">{product.title}</h2>
            <p className="text-xs text-muted mt-1 font-light">{product.subtitle}</p>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-2 text-xs">
              <div className="flex items-center text-gold">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-gold" />
                ))}
              </div>
              <span className="text-ivory font-semibold">{product.avg_rating || '5.0'}</span>
            </div>

            {/* Price */}
            <div className="mt-4 font-num text-2xl font-bold text-gold">
              {formatPrice(selectedVariant ? selectedVariant.price : product.base_price)}
            </div>

            <p className="text-xs text-ivory/80 leading-relaxed mt-3 font-light">
              {product.description}
            </p>

            {/* Olfactory Notes Snapshot */}
            <div className="mt-4 p-3 rounded-lg bg-obsidian border border-gold/15 text-xs space-y-1">
              <div><strong className="text-gold">Top:</strong> {product.top_notes}</div>
              <div><strong className="text-gold">Heart:</strong> {product.heart_notes}</div>
              <div><strong className="text-gold">Base:</strong> {product.base_notes}</div>
            </div>

            {/* Variant Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="mt-4 space-y-2">
                <span className="text-xs text-muted uppercase font-semibold">Select Size / Edition:</span>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        selectedVariant?.id === v.id
                          ? 'bg-gold/20 border-gold text-gold shadow-md'
                          : 'border-gold/20 text-ivory/80 hover:border-gold/50'
                      }`}
                    >
                      {v.size_label} - {formatPrice(v.price)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4 border-t border-gold/15">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  addToCart(product, selectedVariant || product.variants[0], quantity);
                  onClose();
                }}
                className="flex-1 btn-gold py-3 rounded-lg text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                <ShoppingBag className="w-4 h-4" /> Add to Bag
              </button>
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-3 rounded-lg border border-gold/30 hover:border-gold transition-colors ${
                  isLiked ? 'bg-gold text-charcoal' : 'text-ivory hover:bg-gold/10'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </button>
            </div>

            <Link
              to={`/product/${product.slug}`}
              onClick={onClose}
              className="block text-center text-xs text-gold/80 hover:text-gold underline font-light"
            >
              View Full Olfactory Profile & Customer Reviews →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
