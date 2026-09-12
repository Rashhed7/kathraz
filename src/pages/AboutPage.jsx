import React from 'react';
import { Award, Compass, ShieldCheck } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-16">
      {/* Brand Story Header */}
      <div className="text-center space-y-4">
        <span className="text-xs uppercase tracking-[0.3em] text-gold font-semibold flex items-center justify-center gap-1">
          Indian Haute Parfumerie
        </span>
        <h1 className="font-sans text-4xl sm:text-5xl font-bold text-ivory">The Story of KATHRAZ</h1>
        <div className="w-20 h-0.5 bg-gold mx-auto opacity-60"></div>
        <p className="text-sm text-ivory/80 max-w-2xl mx-auto font-light leading-relaxed">
          Founded at the intersection of India's ancient attar distillation heritage and contemporary French perfumery. KATHRAZ brings aged agarwood, Kashmiri saffron, and Indian rose absolutes to discerning connoisseurs across India.
        </p>
      </div>

      {/* Main Image Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="relative aspect-square rounded-2xl overflow-hidden border border-gold/30 shadow-2xl">
          <img src="/images/oud_royal.jpg" alt="Artisanal Oud Bottle" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent"></div>
          <div className="absolute bottom-6 left-6 right-6 text-xs text-gold font-sans tracking-wider">
            HAND-BOTTLED & SEALED IN INDIA
          </div>
        </div>

        <div className="space-y-6 text-xs text-ivory/80 font-light leading-relaxed">
          <h2 className="font-sans text-2xl font-bold text-ivory">Centuries of Incense & Gold</h2>
          <p>
            Along the ancient trade routes of India, fragrance was never merely a cosmetic add-on — it was an armour of identity, part of daily dress and ritual.
          </p>
          <p>
            At KATHRAZ, we honor this legacy by refusing mass-production synthetics. Every batch is aged for a minimum of 90 days in temperature-controlled oak casks, ensuring that the heavy sillage and golden amber resins melt smoothly into the wearer's skin.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gold/15">
            <div className="space-y-1">
              <span className="font-sans text-xl font-bold text-gold block">35%</span>
              <span className="text-muted text-[10px] uppercase">Extrait Concentration</span>
            </div>
            <div className="space-y-1">
              <span className="font-sans text-xl font-bold text-gold block">100%</span>
              <span className="text-muted text-[10px] uppercase">Sustainably Sourced</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
