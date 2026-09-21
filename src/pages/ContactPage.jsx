import React, { useState } from 'react';
import { Mail, Phone, Send, CheckCircle2, Truck } from 'lucide-react';
import { TEL_URL, WHATSAPP_URL, PHONE_DISPLAY, EMAIL_ADDRESS, DELIVERY_NOTE } from '../config/contact';
import Reveal from '../components/Reveal';

function WhatsAppIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
    </svg>
  );
}

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSending(true);
    try {
      const fd = new FormData(e.target);
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fd.get('name'),
          email: fd.get('email'),
          subject: fd.get('subject'),
          message: fd.get('message'),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message');
      setSubmitted(true);
    } catch (err) {
      setFormError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
      <div className="text-center space-y-2">
        <span className="text-[11px] uppercase tracking-[0.25em] text-muted">
          We usually reply within a few hours
        </span>
        <h1 className="font-sans text-3xl sm:text-4xl font-medium text-ivory">Contact Us</h1>
        <p className="text-xs text-muted font-light max-w-md mx-auto">
          Questions about an order, a fragrance, or gifting? The fastest way to
          reach us is WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Contact Form */}
        <Reveal variant="left" className="md:col-span-7">
          <div className="bg-card border border-ivory/10 p-6 sm:p-8 space-y-6">
          {submitted ? (
            <div className="p-8 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-gold mx-auto" />
              <h3 className="font-sans text-xl font-medium text-ivory">Message sent</h3>
              <p className="text-xs text-muted">
                Thank you — we'll get back to you shortly. For anything urgent,
                WhatsApp is fastest.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-muted block mb-1">Your Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Full name"
                    className="w-full bg-obsidian border border-ivory/15 text-ivory p-3 focus:outline-none focus:border-ivory/40"
                  />
                </div>
                <div>
                  <label className="text-muted block mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="you@example.com"
                    className="w-full bg-obsidian border border-ivory/15 text-ivory p-3 focus:outline-none focus:border-ivory/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-muted block mb-1">Subject</label>
                <select name="subject" className="w-full bg-obsidian border border-ivory/15 text-ivory p-3 focus:outline-none focus:border-ivory/40">
                  <option>Order status or support</option>
                  <option>Choosing a fragrance</option>
                  <option>Wholesale & bulk orders</option>
                  <option>Gifting</option>
                </select>
              </div>

              <div>
                <label className="text-muted block mb-1">Message</label>
                <textarea
                  name="message"
                  required
                  rows="4"
                  placeholder="How can we help?"
                  className="w-full bg-obsidian border border-ivory/15 text-ivory p-3 focus:outline-none focus:border-ivory/40"
                />
              </div>

              {formError && (
                <p className="text-[11px] text-ivory">{formError}</p>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full btn-gold py-3.5 uppercase tracking-[0.15em] text-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {sending ? 'Sending…' : 'Send Message'} {!sending && <Send className="w-4 h-4" />}
              </button>
            </form>
          )}
          </div>
        </Reveal>

        {/* Direct Contact */}
        <Reveal variant="right" delay={120} className="md:col-span-5 space-y-6">
          <div className="bg-card border border-ivory/10 p-6 space-y-4 text-xs">
            <h3 className="font-sans text-lg font-medium text-ivory">Talk to us directly</h3>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3.5 bg-obsidian border border-ivory/10 hover:border-ivory/35 transition-colors group"
            >
              <span className="w-9 h-9 rounded-full bg-ivory text-obsidian flex items-center justify-center flex-shrink-0">
                <WhatsAppIcon className="w-5 h-5" />
              </span>
              <span>
                <strong className="text-ivory block">WhatsApp</strong>
                <span className="text-muted">Chat with us — fastest replies</span>
              </span>
            </a>

            <a
              href={TEL_URL}
              className="flex items-center gap-3 p-3.5 bg-obsidian border border-ivory/10 hover:border-ivory/35 transition-colors"
            >
              <span className="w-9 h-9 rounded-full bg-ivory text-obsidian flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4" />
              </span>
              <span>
                <strong className="text-ivory block">Call {PHONE_DISPLAY}</strong>
                <span className="text-muted">Mon–Sat, 10am–8pm IST</span>
              </span>
            </a>

            <a
              href={`mailto:${EMAIL_ADDRESS}`}
              className="flex items-center gap-3 p-3.5 bg-obsidian border border-ivory/10 hover:border-ivory/35 transition-colors"
            >
              <span className="w-9 h-9 rounded-full bg-charcoal text-ivory flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4" />
              </span>
              <span className="min-w-0">
                <strong className="text-ivory block">{EMAIL_ADDRESS}</strong>
                <span className="text-muted">For order & billing queries</span>
              </span>
            </a>
          </div>

          <div className="bg-charcoal/50 border border-ivory/10 p-6 text-xs space-y-2">
            <div className="flex items-center gap-2 text-ivory">
              <Truck className="w-4 h-4 text-ivory" />
              <strong>We deliver across India</strong>
            </div>
            <p className="text-muted font-light leading-relaxed">
              {DELIVERY_NOTE}. Free shipping on orders over ₹5,000. Cash on
              delivery available.
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
