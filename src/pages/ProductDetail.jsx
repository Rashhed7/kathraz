import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ShoppingBag, Heart, ShieldCheck, Truck, Droplet, Clock, Flame, ChevronRight, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('notes');

  // Review Form state
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const { formatPrice, addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  useEffect(() => {
    fetchProductDetail();
  }, [slug]);

  const fetchProductDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${slug}`);
      if (res.ok) {
        const data = await res.json();
        const p = data.product;
        setProduct(p);
        setActiveImage(p.image_url);
        if (p.variants && p.variants.length > 0) {
          setSelectedVariant(p.variants[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!product || !reviewName || !reviewComment) return;

    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: reviewRating,
          user_name: reviewName,
          comment: reviewComment
        })
      });
      if (res.ok) {
        setReviewSubmitted(true);
        fetchProductDetail();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="py-32 text-center text-gold text-sm animate-pulse">
        Unveiling Olfactory Masterpiece...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <h2 className="font-cinzel text-2xl font-bold text-ivory">Fragrance Not Found</h2>
        <Link to="/shop" className="btn-gold inline-block px-6 py-2.5 text-xs uppercase font-bold">Return to Treasury</Link>
      </div>
    );
  }

  const isLiked = isWishlisted(product.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-xs text-muted font-light">
        <Link to="/" className="hover:text-gold">Home</Link>
        <ChevronRight className="w-3 h-3 text-gold/50" />
        <Link to="/shop" className="hover:text-gold">Shop</Link>
        <ChevronRight className="w-3 h-3 text-gold/50" />
        <span className="text-gold font-medium">{product.title}</span>
      </nav>

      {/* Main Product Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden border border-gold/30 bg-obsidian shadow-2xl group">
            <img
              src={activeImage}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <span className="absolute top-4 left-4 bg-gold/90 text-charcoal text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded shadow">
              {product.concentration}
            </span>
          </div>

          {/* Gallery Thumbnails */}
          {product.gallery && product.gallery.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.gallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border transition-all ${
                    activeImage === img ? 'border-gold ring-2 ring-gold/40' : 'border-gold/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Product Details */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs text-gold uppercase tracking-widest font-semibold">
              <span>{product.category_name} • {product.gender}</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> In Stock (Batch #902)
              </span>
            </div>

            <h1 className="font-cinzel text-3xl sm:text-4xl font-bold text-ivory mt-1">{product.title}</h1>
            <p className="text-sm text-muted font-serif italic mt-1">{product.subtitle}</p>

            {/* Rating Stars */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center text-gold">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-gold" />
                ))}
              </div>
              <span className="text-xs font-bold text-ivory">{product.avg_rating || '5.0'}</span>
              <span className="text-xs text-muted">({product.review_count || 12} Verified Reviews)</span>
            </div>
          </div>

          {/* Pricing Display */}
          <div className="p-4 rounded-xl bg-card border border-gold/20 flex items-baseline justify-between">
            <div>
              <span className="text-xs text-muted block uppercase">Selected Price</span>
              <span className="font-num text-3xl font-bold text-gold">
                {formatPrice(selectedVariant ? selectedVariant.price : product.base_price)}
              </span>
            </div>
            {product.sale_price && (
              <span className="text-xs text-muted line-through">
                {formatPrice(product.base_price)}
              </span>
            )}
          </div>

          <p className="text-xs text-ivory/80 leading-relaxed font-light">
            {product.description}
          </p>

          {/* Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs text-muted uppercase font-semibold block">Select Size / Volume:</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                      selectedVariant?.id === v.id
                        ? 'bg-gold/20 border-gold text-gold shadow-md'
                        : 'border-gold/20 text-ivory/80 hover:border-gold/50'
                    }`}
                  >
                    <div className="font-bold">{v.size_label}</div>
                    <div className="text-gold font-num mt-0.5">{formatPrice(v.price)}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Longevity & Sillage Meter */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-obsidian border border-gold/15 text-xs">
            <div className="space-y-1">
              <span className="text-muted uppercase tracking-wider flex items-center gap-1 text-[10px]">
                <Clock className="w-3.5 h-3.5 text-gold" /> Longevity
              </span>
              <div className="font-semibold text-ivory">{product.longevity || '16+ Hours'}</div>
              <div className="w-full bg-card rounded-full h-1 border border-gold/20">
                <div className="bg-gold h-full rounded-full w-[95%]"></div>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-muted uppercase tracking-wider flex items-center gap-1 text-[10px]">
                <Flame className="w-3.5 h-3.5 text-gold" /> Sillage Profile
              </span>
              <div className="font-semibold text-ivory">{product.sillage || 'Enormous / Room-filling'}</div>
              <div className="w-full bg-card rounded-full h-1 border border-gold/20">
                <div className="bg-gold h-full rounded-full w-[90%]"></div>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex gap-4 pt-4 border-t border-gold/15">
            <button
              onClick={() => addToCart(product, selectedVariant || product.variants[0], quantity)}
              className="flex-1 btn-gold py-4 rounded-xl text-xs uppercase font-bold tracking-widest flex items-center justify-center gap-2 shadow-2xl"
            >
              <ShoppingBag className="w-4 h-4" /> Add to Bag
            </button>

            <button
              onClick={() => toggleWishlist(product.id)}
              className={`p-4 rounded-xl border border-gold/30 hover:border-gold transition-colors ${
                isLiked ? 'bg-gold text-charcoal' : 'text-ivory hover:bg-gold/10'
              }`}
              title="Add to Wishlist"
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Value Badges */}
          <div className="grid grid-cols-2 gap-4 pt-2 text-[11px] text-muted">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-gold" /> Free Express Courier over ₹5,000
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-gold" /> Sealed · Authentic Batch · Bottled in India
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Olfactory Pyramid / Artisanal Craft / Reviews */}
      <div className="space-y-8 border-t border-gold/15 pt-12">
        <div className="flex border-b border-gold/20 gap-8 text-sm font-cinzel tracking-wider uppercase font-semibold">
          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === 'notes' ? 'border-gold text-gold' : 'border-transparent text-muted hover:text-ivory'
            }`}
          >
            Olfactory Pyramid
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === 'reviews' ? 'border-gold text-gold' : 'border-transparent text-muted hover:text-ivory'
            }`}
          >
            Client Reviews ({product.reviews ? product.reviews.length : 0})
          </button>
        </div>

        {/* Tab 1: Olfactory Pyramid */}
        {activeTab === 'notes' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
            <div className="bg-card border border-gold/20 p-6 rounded-2xl space-y-2">
              <span className="text-xs uppercase text-gold font-bold tracking-wider block">Top Notes (Opening)</span>
              <h4 className="font-serif text-lg font-bold text-ivory">{product.top_notes}</h4>
              <p className="text-xs text-muted font-light leading-relaxed">
                The immediate sparkle that greets your senses upon application.
              </p>
            </div>

            <div className="bg-card border border-gold/20 p-6 rounded-2xl space-y-2">
              <span className="text-xs uppercase text-gold font-bold tracking-wider block">Heart Notes (Core)</span>
              <h4 className="font-serif text-lg font-bold text-ivory">{product.heart_notes}</h4>
              <p className="text-xs text-muted font-light leading-relaxed">
                The rich floral & agarwood heart that develops over 2-4 hours.
              </p>
            </div>

            <div className="bg-card border border-gold/20 p-6 rounded-2xl space-y-2">
              <span className="text-xs uppercase text-gold font-bold tracking-wider block">Base Notes (Dry Down)</span>
              <h4 className="font-serif text-lg font-bold text-ivory">{product.base_notes}</h4>
              <p className="text-xs text-muted font-light leading-relaxed">
                The enduring amber & musk residue that clings for over 16 hours.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Reviews */}
        {activeTab === 'reviews' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Submit Review */}
            <div className="bg-card border border-gold/20 p-6 rounded-2xl space-y-4">
              <h3 className="font-cinzel text-lg font-bold text-ivory">Write a Client Review</h3>

              {reviewSubmitted ? (
                <div className="p-4 bg-gold/10 border border-gold/30 rounded-lg text-xs text-gold">
                  Thank you! Your verified review has been published to your account.
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-muted block mb-1">Your name</label>
                      <input
                        type="text"
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                        placeholder="e.g. Prince A. or Sarah M."
                        required
                        className="w-full bg-obsidian border border-gold/30 text-ivory p-2.5 rounded-lg focus:outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="text-muted block mb-1">Rating</label>
                      <select
                        value={reviewRating}
                        onChange={(e) => setReviewRating(Number(e.target.value))}
                        className="w-full bg-obsidian border border-gold/30 text-ivory p-2.5 rounded-lg focus:outline-none focus:border-gold"
                      >
                        <option value={5}>★★★★★ (5/5) Exceptional</option>
                        <option value={4}>★★★★☆ (4/5) Very Good</option>
                        <option value={3}>★★★☆☆ (3/5) Average</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-muted block mb-1">Your Olfactory Experience</label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Describe the sillage, longevity, and note evolution..."
                      required
                      className="w-full bg-obsidian border border-gold/30 text-ivory p-3 rounded-lg focus:outline-none focus:border-gold h-24"
                    />
                  </div>
                  <button type="submit" className="btn-gold px-6 py-2.5 rounded-lg font-bold uppercase tracking-wider">
                    Submit Verified Review
                  </button>
                </form>
              )}
            </div>

            {/* List Reviews */}
            <div className="space-y-4">
              {product.reviews && product.reviews.map((rev) => (
                <div key={rev.id} className="bg-obsidian border border-gold/15 p-5 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-ivory text-sm">{rev.user_name}</span>
                      <span className="text-[10px] bg-gold/20 text-gold px-2 py-0.5 rounded font-num">VERIFIED</span>
                    </div>
                    <div className="flex text-gold">
                      {[...Array(rev.rating)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-gold" />)}
                    </div>
                  </div>
                  <p className="text-xs text-ivory/80 font-light italic leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
