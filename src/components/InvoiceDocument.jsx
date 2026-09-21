import React from 'react';
import { EMAIL_ADDRESS, PHONE_DISPLAY } from '../config/contact';

const inr = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

/**
 * A4 print-ready invoice / delivery packing slip.
 * Rendered inside .print-area so browser "Save as PDF" produces a clean file.
 * Each sheet ends with a page break, so stacking multiple invoices prints one per page.
 */
export default function InvoiceDocument({ order }) {
  if (!order) return null;

  const items = order.items || [];
  const fmtDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="invoice-sheet">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000000', paddingBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src="/images/logo.png" alt="KATHRAZ" style={{ height: 56, objectFit: 'contain' }} />
          <div>
            <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: 20, letterSpacing: '0.25em', fontWeight: 700, color: '#000000' }}>
              KATHRAZ
            </div>
            <div style={{ fontSize: 9, letterSpacing: '0.3em', color: '#6B6B6B', textTransform: 'uppercase', marginTop: 2 }}>
              Fragrances · Made in India
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, color: '#6B6B6B', lineHeight: 1.6 }}>
          <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: 15, letterSpacing: '0.15em', color: '#000000', textTransform: 'uppercase' }}>
            Tax Invoice
          </div>
          <div>{EMAIL_ADDRESS}</div>
          <div>{PHONE_DISPLAY}</div>
        </div>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18, fontSize: 11 }}>
        <div>
          <div style={{ color: '#6B6B6B', textTransform: 'uppercase', fontSize: 9, letterSpacing: '0.15em' }}>Invoice / Order No.</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#000000', letterSpacing: '0.05em' }}>{order.order_number}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#6B6B6B', textTransform: 'uppercase', fontSize: 9, letterSpacing: '0.15em' }}>Invoice Date</div>
          <div style={{ fontWeight: 600, color: '#000000' }}>{fmtDate(order.created_at)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#6B6B6B', textTransform: 'uppercase', fontSize: 9, letterSpacing: '0.15em' }}>Payment</div>
          <div style={{ fontWeight: 600, color: '#000000' }}>
            {order.payment_method} · {order.payment_status}
          </div>
        </div>
      </div>

      {/* Deliver To — large block, sized for the packing box */}
      <div style={{ marginTop: 22, border: '1.5px solid #000000', padding: '14px 18px' }}>
        <div style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#000000', fontWeight: 700, marginBottom: 8 }}>
          Deliver To
        </div>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 700, color: '#000000', lineHeight: 1.2 }}>
          {order.customer_name}
        </div>
        <div style={{ fontSize: 13, color: '#000000', marginTop: 6, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
          {order.shipping_address}
        </div>
        <div style={{ fontSize: 13, color: '#000000', marginTop: 6, fontWeight: 600 }}>
          Phone: {order.phone}
        </div>
        {order.tracking_number && (
          <div style={{ fontSize: 11, color: '#6B6B6B', marginTop: 8 }}>
            Courier: {order.courier_name} · Tracking: <span style={{ fontWeight: 700, color: '#000000' }}>{order.tracking_number}</span>
          </div>
        )}
      </div>

      {/* Items table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 22, fontSize: 11 }}>
        <thead>
          <tr style={{ background: '#F4F4F4', textAlign: 'left' }}>
            <th style={{ padding: '8px 10px', borderBottom: '1px solid #D6D6D6', color: '#000000', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase' }}>#</th>
            <th style={{ padding: '8px 10px', borderBottom: '1px solid #D6D6D6', color: '#000000', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Item</th>
            <th style={{ padding: '8px 10px', borderBottom: '1px solid #D6D6D6', color: '#000000', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Size</th>
            <th style={{ padding: '8px 10px', borderBottom: '1px solid #D6D6D6', color: '#000000', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', textAlign: 'center' }}>Qty</th>
            <th style={{ padding: '8px 10px', borderBottom: '1px solid #D6D6D6', color: '#000000', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', textAlign: 'right' }}>Unit Price</th>
            <th style={{ padding: '8px 10px', borderBottom: '1px solid #D6D6D6', color: '#000000', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.id || idx}>
              <td style={{ padding: '8px 10px', borderBottom: '1px solid #E9E9E9', color: '#6B6B6B' }}>{idx + 1}</td>
              <td style={{ padding: '8px 10px', borderBottom: '1px solid #E9E9E9', fontWeight: 600, color: '#000000' }}>
                {item.product_title}
              </td>
              <td style={{ padding: '8px 10px', borderBottom: '1px solid #E9E9E9', color: '#000000' }}>{item.size_label}</td>
              <td style={{ padding: '8px 10px', borderBottom: '1px solid #E9E9E9', textAlign: 'center', color: '#000000' }}>{item.quantity}</td>
              <td style={{ padding: '8px 10px', borderBottom: '1px solid #E9E9E9', textAlign: 'right', color: '#000000' }}>{inr(item.price)}</td>
              <td style={{ padding: '8px 10px', borderBottom: '1px solid #E9E9E9', textAlign: 'right', fontWeight: 700, color: '#000000' }}>{inr(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <table style={{ fontSize: 11, minWidth: 260 }}>
          <tbody>
            <tr>
              <td style={{ padding: '4px 10px', color: '#6B6B6B' }}>Subtotal</td>
              <td style={{ padding: '4px 10px', textAlign: 'right', fontWeight: 600, color: '#000000' }}>{inr(order.subtotal)}</td>
            </tr>
            {Number(order.discount_amount) > 0 && (
              <tr>
                <td style={{ padding: '4px 10px', color: '#6B6B6B' }}>Discount</td>
                <td style={{ padding: '4px 10px', textAlign: 'right', fontWeight: 600, color: '#000000' }}>− {inr(order.discount_amount)}</td>
              </tr>
            )}
            <tr>
              <td style={{ padding: '4px 10px', color: '#6B6B6B' }}>Shipping</td>
              <td style={{ padding: '4px 10px', textAlign: 'right', fontWeight: 600, color: '#000000' }}>
                {Number(order.shipping_fee) > 0 ? inr(order.shipping_fee) : 'Free'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px 10px', borderTop: '2px solid #000000', fontWeight: 700, color: '#000000', fontSize: 12 }}>
                Grand Total
              </td>
              <td style={{ padding: '8px 10px', borderTop: '2px solid #000000', textAlign: 'right', fontWeight: 700, fontSize: 14, color: '#000000' }}>
                {inr(order.total_amount)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Gift message */}
      {order.gift_message ? (
        <div style={{ marginTop: 16, background: '#FFFFFF', border: '1px dashed #D6D6D6', padding: '10px 14px', fontSize: 11, color: '#000000' }}>
          <strong style={{ color: '#000000', textTransform: 'uppercase', fontSize: 9, letterSpacing: '0.15em' }}>Gift note:</strong>{' '}
          {order.gift_message}
        </div>
      ) : null}

      {/* Footer */}
      <div style={{ marginTop: 28, paddingTop: 14, borderTop: '1px solid #E9E9E9', fontSize: 10, color: '#6B6B6B', display: 'flex', justifyContent: 'space-between' }}>
        <span>Thank you for shopping with KATHRAZ Fragrances.</span>
        <span>This is a computer-generated invoice.</span>
      </div>
    </div>
  );
}
