import React, { useState } from 'react';
import { RefreshCw, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

const STEPS = [
  {
    key: 'mood',
    index: '01',
    title: 'What kind of presence do you want?',
    options: [
      { label: 'Dark and commanding', value: 'Regal', desc: 'Agarwood, smoke, incense' },
      { label: 'Warm and romantic', value: 'Romance', desc: 'Rose, amber, vanilla' },
      { label: 'Sharp and spiced', value: 'Sharp', desc: 'Saffron, dry spice' },
      { label: 'For a space, not skin', value: 'Atmosphere', desc: 'Rooms, cars, fabric' },
    ],
  },
  {
    key: 'note',
    index: '02',
    title: 'Which materials pull you in?',
    options: [
      { label: 'Oud & leather', value: 'Oud', desc: 'Deep, woody, lingering' },
      { label: 'Rose & amber', value: 'Rose', desc: 'Velvety floral, warm base' },
      { label: 'Saffron & spice', value: 'Saffron', desc: 'Dry, radiant, exotic' },
      { label: 'Incense & woods', value: 'Smoky', desc: 'Resinous, meditative' },
    ],
  },
  {
    key: 'occasion',
    index: '03',
    title: 'When will you wear it?',
    options: [
      { label: 'Evenings out', value: 'Evening', desc: 'Strong projection, long wear' },
      { label: 'Every day', value: 'Daily', desc: 'Versatile, not overwhelming' },
      { label: 'Weddings & festivals', value: 'Festive', desc: 'Rich, celebratory' },
      { label: 'Close encounters', value: 'Intimate', desc: 'Skin-close warmth' },
    ],
  },
];

export default function ScentFinder({ products, onSelectProduct }) {
  const [step, setStep] = useState(1); // 1..3 question, 4 = result
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

  const current = STEPS[step - 1];

  return (
    <div className="border-y border-ivory/10 bg-charcoal/40">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-5">
            <span className="h-px w-8 bg-gold/60" aria-hidden="true" />
            <p className="text-[10px] uppercase tracking-[0.35em] text-gold">Not sure where to start</p>
            <span className="h-px w-8 bg-gold/60" aria-hidden="true" />
          </div>
          <h2 className="font-sans text-3xl sm:text-4xl font-medium text-ivory leading-tight">
            Three questions,
            <span className="text-muted"> one recommendation</span>
          </h2>
        </div>

        {/* Progress — numbered steps */}
        {step <= 3 && (
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-12">
            {STEPS.map((s, i) => {
              const n = i + 1;
              const active = n === step;
              const done = n < step;
              return (
                <React.Fragment key={s.key}>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-num text-[11px] tracking-widest transition-colors duration-300 ${
                        active ? 'text-gold' : done ? 'text-ivory/70' : 'text-ivory/30'
                      }`}
                    >
                      {s.index}
                    </span>
                    <span
                      className={`h-px w-8 sm:w-14 transition-colors duration-300 ${
                        active ? 'bg-gold' : done ? 'bg-ivory/60' : 'bg-ivory/15'
                      }`}
                      aria-hidden="true"
                    />
                  </div>
                </React.Fragment>
              );
            })}
            <span className="font-num text-[11px] tracking-widest text-ivory/30">04</span>
          </div>
        )}

        {/* Question steps */}
        {step <= 3 && current && (
          <div key={current.key} className="animate-fadeIn">
            <h3 className="text-center font-sans text-lg sm:text-xl text-ivory mb-8">
              {current.title}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {current.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(current.key, opt.value)}
                  className="group flex items-center justify-between gap-4 p-4 sm:p-5 bg-obsidian border border-ivory/10 hover:border-gold/60 transition-all duration-300 text-left"
                >
                  <span>
                    <span className="block text-sm text-ivory">{opt.label}</span>
                    <span className="block text-xs text-muted mt-1 font-light">{opt.desc}</span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-ivory/25 group-hover:text-gold group-hover:translate-x-0.5 transition-all duration-300 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Result */}
        {step === 4 && recommendation && (
          <div className="animate-fadeIn max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <p className="text-[10px] uppercase tracking-[0.35em] text-gold">Your recommendation</p>
              <button
                onClick={resetFinder}
                className="text-[11px] uppercase tracking-[0.15em] text-muted hover:text-ivory flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Start over
              </button>
            </div>

            <div className="bg-obsidian border border-ivory/10 flex flex-col sm:flex-row">
              <img
                src={recommendation.image_url}
                alt={recommendation.title}
                className="w-full sm:w-44 h-44 object-cover shrink-0"
              />
              <div className="flex-1 p-6 sm:p-7 flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted">
                  {recommendation.concentration}
                </span>
                <h3 className="font-sans text-xl text-ivory mt-1.5">{recommendation.title}</h3>
                <p className="text-xs text-muted font-light line-clamp-2 mt-2 leading-relaxed">
                  {recommendation.description}
                </p>
                <div className="mt-auto pt-5 flex items-center justify-between gap-4">
                  <span className="font-num text-lg text-ivory">
                    {formatPrice(recommendation.base_price)}
                  </span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => onSelectProduct && onSelectProduct(recommendation)}
                      className="text-[11px] uppercase tracking-[0.15em] text-muted hover:text-ivory transition-colors"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => {
                        addToCart(recommendation, recommendation.variants ? recommendation.variants[0] : { id: 1, size_label: '50ml', price: recommendation.base_price });
                      }}
                      className="btn-gold px-6 py-3 text-[11px] uppercase tracking-[0.2em] whitespace-nowrap"
                    >
                      Add to Bag
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
