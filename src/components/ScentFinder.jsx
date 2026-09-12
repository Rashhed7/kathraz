import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ScentFinder({ products, onSelectProduct }) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({ mood: '', note: '', occasion: '' });
  const [recommendation, setRecommendation] = useState(null);
  const { formatPrice, addToCart } = useCart();

  const handleSelect = (category, value) => {
    const updated = { ...answers, [category]: value };
    setAnswers(updated);
    if (step < 3) {
      setStep(step + 1);
    } else {
      calculateRecommendation(updated);
    }
  };

  const calculateRecommendation = (finalAnswers) => {
    if (!products || products.length === 0) return;
    let match = products[0];
    if (finalAnswers.note === 'Oud' || finalAnswers.mood === 'Regal') {
      match = products.find(p => p.slug.includes('oud')) || products[0];
    } else if (finalAnswers.note === 'Rose' || finalAnswers.mood === 'Romance') {
      match = products.find(p => p.slug.includes('rose')) || products[1] || products[0];
    } else if (finalAnswers.note === 'Smoky' || finalAnswers.mood === 'Atmosphere') {
      match = products.find(p => p.slug.includes('oud')) || products[0];
    } else {
      match = products.find(p => p.slug.includes('saffron')) || products[0];
    }

    setRecommendation(match);
    setStep(4);
  };

  const resetFinder = () => {
    setStep(1);
    setAnswers({ mood: '', note: '', occasion: '' });
    setRecommendation(null);
  };

  return (
    <div className="bg-card border border-ivory/10 p-6 sm:p-10">
      <p className="text-[11px] uppercase tracking-[0.25em] text-muted mb-2">Not sure where to start</p>
      <h2 className="font-sans text-2xl sm:text-3xl font-medium text-ivory">
        Three questions, one recommendation
      </h2>

      {/* Progress */}
      {step <= 3 && (
        <div className="flex items-center gap-2 my-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-px flex-1 transition-colors duration-300 ${
                s <= step ? 'bg-gold' : 'bg-ivory/15'
              }`}
            ></div>
          ))}
        </div>
      )}

      {/* Step 1 */}
      {step === 1 && (
        <div className="space-y-4 animate-fadeIn">
          <h3 className="font-sans text-lg text-ivory">What kind of presence do you want?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Dark and commanding', value: 'Regal', desc: 'Agarwood, smoke, incense' },
              { label: 'Warm and romantic', value: 'Romance', desc: 'Rose, amber, vanilla' },
              { label: 'Sharp and spiced', value: 'Sharp', desc: 'Saffron, dry spice' },
              { label: 'For a space, not skin', value: 'Atmosphere', desc: 'Rooms, cars, fabric' }
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect('mood', opt.value)}
                className="p-4 bg-obsidian border border-ivory/10 hover:border-ivory/35 transition-colors text-left"
              >
                <div className="text-sm text-ivory">{opt.label}</div>
                <div className="text-xs text-muted mt-1 font-light">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="space-y-4 animate-fadeIn">
          <h3 className="font-sans text-lg text-ivory">Which materials pull you in?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Oud & leather', value: 'Oud', desc: 'Deep, woody, lingering' },
              { label: 'Rose & amber', value: 'Rose', desc: 'Velvety floral, warm base' },
              { label: 'Saffron & spice', value: 'Saffron', desc: 'Dry, radiant, exotic' },
              { label: 'Incense & woods', value: 'Smoky', desc: 'Resinous, meditative' }
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect('note', opt.value)}
                className="p-4 bg-obsidian border border-ivory/10 hover:border-ivory/35 transition-colors text-left"
              >
                <div className="text-sm text-ivory">{opt.label}</div>
                <div className="text-xs text-muted mt-1 font-light">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="space-y-4 animate-fadeIn">
          <h3 className="font-sans text-lg text-ivory">When will you wear it?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Evenings out', value: 'Evening', desc: 'Strong projection, long wear' },
              { label: 'Every day', value: 'Daily', desc: 'Versatile, not overwhelming' },
              { label: 'Weddings & festivals', value: 'Festive', desc: 'Rich, celebratory' },
              { label: 'Close encounters', value: 'Intimate', desc: 'Skin-close warmth' }
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect('occasion', opt.value)}
                className="p-4 bg-obsidian border border-ivory/10 hover:border-ivory/35 transition-colors text-left"
              >
                <div className="text-sm text-ivory">{opt.label}</div>
                <div className="text-xs text-muted mt-1 font-light">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {step === 4 && recommendation && (
        <div className="animate-fadeIn pt-2">
          <div className="flex items-center justify-between mb-5">
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted">Our recommendation</p>
            <button
              onClick={resetFinder}
              className="text-xs text-muted hover:text-ivory flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Start over
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-obsidian border border-ivory/10">
            <img
              src={recommendation.image_url}
              alt={recommendation.title}
              className="w-28 h-28 object-cover"
            />
            <div className="space-y-1.5 flex-1 text-center sm:text-left">
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted">{recommendation.concentration}</span>
              <h3 className="font-sans text-xl text-ivory">{recommendation.title}</h3>
              <p className="text-xs text-muted font-light line-clamp-2 max-w-md">{recommendation.description}</p>
              <div className="text-sm text-ivory pt-1">
                {formatPrice(recommendation.base_price)}
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  addToCart(recommendation, recommendation.variants ? recommendation.variants[0] : { id: 1, size_label: '50ml', price: recommendation.base_price });
                }}
                className="btn-gold px-6 py-2.5 text-xs uppercase tracking-[0.15em] whitespace-nowrap"
              >
                Add to Bag
              </button>
              <button
                onClick={() => onSelectProduct && onSelectProduct(recommendation)}
                className="text-xs text-muted hover:text-ivory py-1 transition-colors"
              >
                Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
