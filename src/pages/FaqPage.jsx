import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Reveal from '../components/Reveal';

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
      a: 'Yes. During cart review or checkout, toggle "Add a gift message" and we will include a printed card with your note.'
    }
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <span className="text-xs uppercase tracking-widest text-muted font-semibold">Help</span>
        <h1 className="font-sans text-3xl font-bold text-ivory">Frequently asked questions</h1>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => (
          <Reveal key={idx} delay={idx * 70} variant="fade">
            <div className="bg-card border border-gold/20 rounded-xl overflow-hidden glass-panel transition-colors">
              <button
                onClick={() => setOpenIndex(openIndex === idx ? -1 : idx)}
                className="w-full p-5 text-left flex items-center justify-between font-sans font-bold text-base text-ivory hover:text-muted"
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
          </Reveal>
        ))}
      </div>
    </div>
  );
}
