// Minimal Brevo (Sendinblue) v3 transactional email client.
// Works everywhere this app runs: plain HTTPS fetch — no SMTP, no Node-only
// APIs — so it is bundle-safe for Cloudflare Workers.
//
// Required secrets (set via `npx wrangler secret put`):
//   BREVO_API_KEY   — xkeysib-... key from Brevo dashboard (SMTP & API -> API keys)
//   MAIL_FROM       — your VERIFIED sender email in Brevo (e.g. you@gmail.com)
//
// If either is missing, sendEmail() fails soft: logs and returns false, so
// features like forgot-password can degrade gracefully.

const BREVO_API = 'https://api.brevo.com/v3/smtp/email';

async function sendEmail({ to, subject, html, text }) {
  const apiKey = process.env.BREVO_API_KEY;
  const from = process.env.MAIL_FROM;

  if (!apiKey || !from) {
    console.warn('[mailer] BREVO_API_KEY / MAIL_FROM not set — skipping email to', to);
    return false;
  }

  try {
    const res = await fetch(BREVO_API, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { email: from, name: 'KATHRAZ Fragrances' },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text || undefined,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[mailer] Brevo error', res.status, body.slice(0, 300));
      return false;
    }
    return true;
  } catch (err) {
    console.error('[mailer] send failed:', err.message);
    return false;
  }
}

// Branded password-reset email.
function passwordResetEmail({ name, resetUrl, minutes = 30 }) {
  const text =
    `Hi ${name},\n\n` +
    `We received a request to reset your KATHRAZ password.\n` +
    `This link is valid for ${minutes} minutes:\n${resetUrl}\n\n` +
    `If you didn't request this, you can safely ignore this email — ` +
    `your password will remain unchanged.\n\n` +
    `— KATHRAZ FRAGRANCES INDIA`;

  const html = `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0d0b09;font-family:Georgia,'Times New Roman',serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d0b09;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background:#171310;border:1px solid #b8963e33;border-radius:16px;">
          <tr><td style="padding:32px 32px 8px 32px;text-align:center;">
            <div style="color:#e8c66a;font-size:12px;letter-spacing:3px;text-transform:uppercase;">KATHRAZ</div>
            <div style="color:#f5efe2;font-size:22px;font-weight:bold;margin-top:12px;">Reset your password</div>
          </td></tr>
          <tr><td style="padding:16px 32px 4px 32px;color:#cfc7b8;font-size:14px;line-height:1.7;">
            Hi ${escapeHtml(name)},<br /><br />
            We received a request to reset the password for your account.
            Click the button below to choose a new one — this link expires in
            <strong style="color:#e8c66a;">${minutes} minutes</strong>.
          </td></tr>
          <tr><td align="center" style="padding:24px 32px;">
            <a href="${resetUrl}"
               style="display:inline-block;background:#e8c66a;color:#171310;font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;text-decoration:none;padding:14px 36px;border-radius:999px;">
              Reset password
            </a>
          </td></tr>
          <tr><td style="padding:0 32px;color:#8d8574;font-size:12px;line-height:1.6;">
            If the button doesn't work, copy this link into your browser:<br />
            <span style="color:#e8c66a;word-break:break-all;">${resetUrl}</span>
          </td></tr>
          <tr><td style="padding:24px 32px 32px 32px;color:#8d8574;font-size:11px;line-height:1.6;border-top:1px solid #b8963e22;">
            Didn't request a reset? Ignore this email — your password stays unchanged.
            <br /><br />© KATHRAZ FRAGRANCES INDIA
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  return { subject: 'Reset your KATHRAZ password', html, text };
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// ---------- Order emails ----------

// Shared email scaffold so all order mails look consistent.
function orderEmailShell({ title, introHtml, bodyHtml, footerNote }) {
  return (html) => `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0d0b09;font-family:Georgia,'Times New Roman',serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d0b09;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#171310;border:1px solid #b8963e33;border-radius:16px;">
          <tr><td style="padding:32px 32px 8px 32px;text-align:center;">
            <div style="color:#e8c66a;font-size:12px;letter-spacing:3px;text-transform:uppercase;">KATHRAZ</div>
            <div style="color:#f5efe2;font-size:22px;font-weight:bold;margin-top:12px;">${title}</div>
          </td></tr>
          <tr><td style="padding:16px 32px 0 32px;color:#cfc7b8;font-size:14px;line-height:1.7;">
            ${introHtml}
          </td></tr>
          <tr><td style="padding:8px 32px 0 32px;">
            ${bodyHtml}
          </td></tr>
          <tr><td style="padding:20px 32px 32px 32px;color:#8d8574;font-size:11px;line-height:1.6;border-top:1px solid #b8963e22;">
            ${html}
            <br /><br />© KATHRAZ FRAGRANCES INDIA
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function formatINR(n) {
  const num = Number(n) || 0;
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function itemsTable(items, { showTotals = true } = {}) {
  const rows = (items || [])
    .map(
      (it) => `
        <tr>
          <td style="padding:8px 0;color:#f5efe2;font-size:13px;">
            ${escapeHtml(it.product_title)}<br />
            <span style="color:#8d8574;font-size:11px;">${escapeHtml(it.size_label)} × ${it.quantity}</span>
          </td>
          <td align="right" style="padding:8px 0;color:#f5efe2;font-size:13px;white-space:nowrap;">
            ${formatINR(showTotals ? it.total : it.price)}
          </td>
        </tr>`
    )
    .join('');
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #b8963e33;border-bottom:1px solid #b8963e33;">
      ${rows}
    </table>`;
}

function totalsBlock(order) {
  const rows = [
    ['Subtotal', formatINR(order.subtotal)],
  ];
  if (Number(order.discount_amount) > 0) rows.push(['Discount', '− ' + formatINR(order.discount_amount)]);
  rows.push(['Shipping', Number(order.shipping_fee) > 0 ? formatINR(order.shipping_fee) : 'FREE']);
  rows.push(['<strong style="color:#e8c66a;">Total</strong>', `<strong style="color:#e8c66a;">${formatINR(order.total_amount)}</strong>`]);
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${rows
        .map(
          ([label, val]) => `
        <tr>
          <td style="padding:4px 0;color:#8d8574;font-size:12px;">${label}</td>
          <td align="right" style="padding:4px 0;color:#cfc7b8;font-size:12px;white-space:nowrap;">${val}</td>
        </tr>`
        )
        .join('')}
    </table>`;
}

function statusBadge(status) {
  return `<span style="display:inline-block;background:#e8c66a22;border:1px solid #e8c66a66;color:#e8c66a;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;padding:4px 12px;border-radius:999px;">${escapeHtml(status)}</span>`;
}

/**
 * Order placed + invoice email.
 * @param {object} p  { order, items }
 */
function orderPlacedEmail({ order, items }) {
  const shell = orderEmailShell({});

  const bodyHtml = `
    ${itemsTable(items)}
    <div style="padding-top:12px;">${totalsBlock(order)}</div>
    <table role="presentation" width="100%" style="margin-top:16px;background:#171310;border-radius:10px;border:1px solid #b8963e22;">
      <tr><td style="padding:12px 16px;color:#8d8574;font-size:11px;line-height:1.8;">
        <div><span style="color:#e8c66a;">Order:</span> ${escapeHtml(order.order_number)}</div>
        <div><span style="color:#e8c66a;">Payment:</span> ${escapeHtml(order.payment_method)} · ${escapeHtml(order.payment_status)}</div>
        <div><span style="color:#e8c66a;">Tracking:</span> ${escapeHtml(order.courier_name || 'Royal Express Logistics')} · ${escapeHtml(order.tracking_number || '—')}</div>
        <div><span style="color:#e8c66a;">Ship to:</span> ${escapeHtml(order.shipping_address)}</div>
      </td></tr>
    </table>`;

  const html = shell(`
    Track or manage this order anytime with your order number
    <strong style="color:#e8c66a;">${escapeHtml(order.order_number)}</strong>
    on the Track Order page.`);

  const text =
    `Hi ${order.customer_name},\n\n` +
    `Your order ${order.order_number} has been placed.\n\n` +
    items.map((i) => `- ${i.product_title} (${i.size_label}) x${i.quantity} - ${formatINR(i.total)}`).join('\n') +
    `\n\nSubtotal: ${formatINR(order.subtotal)}\n` +
    (Number(order.discount_amount) > 0 ? `Discount: -${formatINR(order.discount_amount)}\n` : '') +
    `Shipping: ${Number(order.shipping_fee) > 0 ? formatINR(order.shipping_fee) : 'FREE'}\n` +
    `Total: ${formatINR(order.total_amount)}\n\n` +
    `Payment: ${order.payment_method} (${order.payment_status})\n` +
    `Tracking: ${order.courier_name || 'Royal Express Logistics'} ${order.tracking_number || ''}\n\n` +
    `Thank you for shopping with KATHRAZ.`;

  return {
    subject: `Order confirmed — ${order.order_number} · KATHRAZ`,
    html,
    text,
  };
}

/**
 * Order status update email (any status change incl. payment updates).
 * @param {object} p  { order, items, newStatus, paymentStatus, trackingNumber, courierName }
 */
function orderStatusEmail({ order, items = [], newStatus, paymentStatus, trackingNumber, courierName }) {
  const shell = orderEmailShell({});

  const trackLine =
    trackingNumber || order.tracking_number
      ? `<div style="margin-top:8px;color:#8d8574;font-size:12px;">Courier: ${escapeHtml(courierName || order.courier_name || 'Royal Express Logistics')} · Tracking: <strong style="color:#e8c66a;">${escapeHtml(trackingNumber || order.tracking_number)}</strong></div>`
      : '';

  const bodyHtml =
    items.length > 0
      ? `${itemsTable(items, { showTotals: false })}${trackLine}`
      : trackLine;

  const html = shell(
    `Your order <strong style="color:#e8c66a;">${escapeHtml(order.order_number)}</strong> is now ${statusBadge(newStatus)}.
     ${paymentStatus ? `<div style="margin-top:8px;color:#8d8574;font-size:12px;">Payment status: ${escapeHtml(paymentStatus)}</div>` : ''}`
  );

  const text =
    `Hi ${order.customer_name},\n\n` +
    `Your order ${order.order_number} status: ${newStatus}` +
    (paymentStatus ? `\nPayment: ${paymentStatus}` : '') +
    (trackingNumber || order.tracking_number
      ? `\nCourier: ${courierName || order.courier_name || 'Royal Express Logistics'} — Tracking: ${trackingNumber || order.tracking_number}`
      : '') +
    `\n\nThank you for shopping with KATHRAZ.`;

  return {
    subject: `Order ${order.order_number} — ${newStatus} · KATHRAZ`,
    html,
    text,
  };
}

module.exports = {
  sendEmail,
  passwordResetEmail,
  orderPlacedEmail,
  orderStatusEmail,
};
