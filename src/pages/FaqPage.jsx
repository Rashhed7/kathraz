import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'What is the concentration of KATHRAZ Extrait de Parfum?',
      a: 'All KATHRAZ personal fragrances are formulated at an ultra-concentrated 35% Extrait de Parfum ratio. This ensures a rich, multi-layered evolution on skin that lingers for 16+ hours.'
    },
    {
      q: 'Are your Oud and floral oils natural and authentic?',
      a: 'Yes. We source aged wild Assam agarwood resin, authentic Indian rose absolutes, and certified Kashmiri Saffron. Each bottle is batch-numbered and sealed in India.'
    },
    {
      q: 'How does the Razorpay checkout work?',
      a: 'Our checkout supports instant UPI payments (Google Pay, PhonePe, Paytm), Credit & Debit cards (Visa, Mastercard, Amex), NetBanking, and Cash on Delivery (COD).'
    },
    {
      q: 'What are the delivery timelines and shipping charges?',
      a: 'Complimentary Express Courier shipping is provided on all orders exceeding ₹5,000. Express delivery takes 2-4 business days across India.'
    },
    {
      q: 'Can I request custom gift packaging and notes?',
      a: 'Absolutely. During cart review or checkout, toggle "Add a gift card" to include a personalized message printed on gold-embossed KATHRAZ stationery.'
    }
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <span className="text-xs uppercase tracking-widest text-gold font-semibold flex items-center justify-center gap-1">
          <HelpCircle className="w-4 h-4" /> Frequently Asked Questions
        </span>
        <h1 className="font-cinzel text-3xl font-bold text-ivory">Frequently Asked Questions</h1>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="bg-card border border-gold/20 rounded-xl overflow-hidden glass-panel transition-colors"
          >
            <button
              onClick={() => setOpenIndex(openIndex === idx ? -1 : idx)}
              className="w-full p-5 text-left flex items-center justify-between font-serif font-bold text-base text-ivory hover:text-gold"
            >
              <span>{faq.q}</span>
              <ChevronDown className={`w-5 h-5 text-gold transition-transform duration-300 ${openIndex === idx ? 'rotate-180' : ''}`} />
            </button>

            {openIndex === idx && (
              <div className="p-5 pt-0 text-xs text-muted font-light leading-relaxed border-t border-gold/10">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
