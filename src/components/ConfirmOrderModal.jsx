import { useEffect } from 'react';
import { ClipboardCheck, X } from 'lucide-react';
import OverlayPortal from './OverlayPortal';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

/**
 * Pre-order confirmation popup. Opens when the customer presses
 * "Complete Order" on checkout; only the Confirm button inside actually
 * places the order (COD straight through, Razorpay opens the gateway).
 * On success checkout navigates to the thank-you page.
 */
export default function ConfirmOrderModal({
  total,
  paymentMethod,
  customerName,
  address,
  email,
  placing,
  formatPrice,
  onConfirm,
  onCancel,
}) {
  useBodyScrollLock(true);

  // Escape closes — but not while the order is being placed.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !placing) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, placing]);

  return (
    <OverlayPortal>
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm animate-fadeIn"
        onClick={placing ? undefined : onCancel}
        role="presentation"
      >
        <div
          className="relative w-full max-w-md bg-card border border-gold/30 rounded-2xl shadow-2xl p-7 sm:p-8 animate-popIn"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Confirm your order"
        >
          {!placing && (
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-1.5 text-muted hover:text-ivory transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mb-4">
              <ClipboardCheck className="w-7 h-7 text-gold" strokeWidth={1.5} />
            </div>
            <h2 className="font-sans text-xl sm:text-2xl font-bold text-ivory">Confirm your order</h2>
            <p className="mt-1.5 text-xs text-muted">
              Please review the summary below before placing your order.
            </p>
          </div>

          <div className="mt-6 space-y-2.5 text-xs bg-obsidian border border-gold/20 rounded-xl p-4">
            <div className="flex justify-between gap-4">
              <span className="text-muted">Total</span>
              <span className="font-num font-bold text-gold text-sm">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted">Payment</span>
              <span className="text-ivory font-semibold">
                {paymentMethod === 'COD' ? 'Cash on Delivery' : 'Razorpay (UPI / Card / NetBanking)'}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted">Deliver to</span>
              <span className="text-ivory text-right max-w-[60%] break-words">
                {customerName}
                {address ? `, ${address}` : ''}
              </span>
            </div>
            {email && (
              <div className="flex justify-between gap-4">
                <span className="text-muted">Invoice to</span>
                <span className="text-ivory text-right max-w-[60%] break-words">{email}</span>
              </div>
            )}
          </div>

          <p className="mt-4 text-center text-[11px] text-muted">
            A confirmation email with your itemized invoice (PDF) will be sent to your inbox.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={placing}
              className="py-3.5 rounded-xl text-xs uppercase font-bold tracking-widest border border-gold/30 text-ivory hover:bg-gold/10 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={placing}
              className="btn-gold py-3.5 rounded-xl text-xs uppercase font-bold tracking-widest shadow-xl disabled:opacity-50"
            >
              {placing ? 'Placing…' : 'Confirm Order'}
            </button>
          </div>
        </div>
      </div>
    </OverlayPortal>
  );
}
