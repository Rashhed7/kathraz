// Invoice PDF generator — pure-JS pdf-lib, no fonts from disk, no Node-only
// APIs, so it runs identically on Node and the Cloudflare Workers runtime.
//
// Produces a clean A4 tax invoice matching the site's monochrome print style.
// Returns PDF bytes; orders.js base64-encodes them for the Brevo attachment.

const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const inr = (n) =>
  'Rs.' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// WinAnsi (StandardFonts) can't encode "₹" or curly quotes — strip/replace
// anything outside Latin-1 so pdf-lib never throws mid-encode.
const safe = (s) =>
  String(s ?? '')
    .replace(/₹/g, 'Rs.')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^\x00-\xFF]/g, '');

/**
 * Builds the invoice PDF for an order.
 * @param {object} order   row from `orders`
 * @param {Array}  items   rows from `order_items`
 * @returns {Promise<Buffer>}
 */
async function buildInvoicePdf(order, items = []) {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const A4 = { w: 595.28, h: 841.89 };
  const M = 48;
  const ink = rgb(0, 0, 0);
  const muted = rgb(0.42, 0.42, 0.42);
  const line = rgb(0.85, 0.85, 0.85);

  // Wrap long text (addresses, titles) to a max pixel width.
  const wrap = (text, size, maxWidth, font = regular) => {
    const words = safe(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let current = '';
    for (const word of words) {
      const attempt = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(attempt, size) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = attempt;
      }
    }
    if (current) lines.push(current);
    return lines;
  };

  // Rendered as a closure over `pageRef` so page breaks just swap the page.
  let page = doc.addPage([A4.w, A4.h]);
  let y = A4.h - M;

  const draw = (text, x, yy, size = 10, isBold = false, color = ink) =>
    page.drawText(safe(text), { x, y: yy, size, font: isBold ? bold : regular, color });

  const hline = (yy, color = line, thickness = 0.75) =>
    page.drawLine({ start: { x: M, y: yy }, end: { x: A4.w - M, y: yy }, thickness, color });

  // ---------- Header ----------
  draw('KATHRAZ', M, y - 14, 22, true);
  draw('FRAGRANCES - MADE IN INDIA', M, y - 30, 8, false, muted);

  const rightTitle = 'TAX INVOICE';
  const rightTitleW = bold.widthOfTextAtSize(rightTitle, 14);
  draw(rightTitle, A4.w - M - rightTitleW, y - 12, 14, true);
  const contact = 'kathrazfragrances@gmail.com  |  +91 72595 16443';
  const contactW = regular.widthOfTextAtSize(safe(contact), 9);
  draw(contact, A4.w - M - contactW, y - 26, 9, false, muted);

  hline(y - 44, ink, 1.5);
  y -= 66;

  // ---------- Meta row ----------
  draw('INVOICE / ORDER NO.', M, y, 8, false, muted);
  draw(order.order_number, M, y - 14, 12, true);

  const dateLabel = 'INVOICE DATE';
  const dateW = regular.widthOfTextAtSize(dateLabel, 8);
  draw(dateLabel, A4.w / 2 - dateW / 2, y, 8, false, muted);
  const dateVal = fmtDate(order.created_at);
  const dateValW = regular.widthOfTextAtSize(dateVal, 10);
  draw(dateVal, A4.w / 2 - dateValW / 2, y - 14, 10);

  const payLabel = 'PAYMENT';
  const payW = regular.widthOfTextAtSize(payLabel, 8);
  draw(payLabel, A4.w - M - payW, y, 8, false, muted);
  const payVal = `${order.payment_method || ''} | ${order.payment_status || ''}`;
  const payValW = regular.widthOfTextAtSize(safe(payVal), 10);
  draw(payVal, A4.w - M - payValW, y - 14, 10, true);

  y -= 44;

  // ---------- Deliver To box ----------
  const boxTop = y;
  const boxLines = [
    { text: String(order.customer_name || ''), size: 15, bold: true, gap: 19 },
    ...String(order.shipping_address || '')
      .split('\n')
      .flatMap((l) => wrap(l, 10, A4.w - M * 2 - 36).map((t) => ({ text: t, size: 10, bold: false, gap: 14 }))),
    { text: `Phone: ${order.phone || ''}`, size: 10, bold: true, gap: 14 },
  ];
  // NOTE: courier/tracking intentionally NOT shown on the invoice — they are
  // set manually by the admin at shipping time and live in the shipped email.

  const boxHeight = 28 + boxLines.reduce((h, l) => h + l.gap, 0) + 6;
  y -= boxHeight;
  page.drawRectangle({ x: M, y, width: A4.w - M * 2, height: boxHeight, borderColor: ink, borderWidth: 1.5 });

  let by = boxTop - 22;
  draw('DELIVER TO', M + 18, by, 8, true);
  by -= 4;
  for (const l of boxLines) {
    draw(l.text, M + 18, by - l.gap + 6, l.size, l.bold);
    by -= l.gap;
  }

  y -= 24;

  // ---------- Items table ----------
  const cols = { no: M + 10, item: M + 40, size: M + 290, qty: M + 380, unit: M + 430, amt: A4.w - M - 10 };
  const rowH = 22;

  const tableHeader = () => {
    draw('#', cols.no, y, 8, true, muted);
    draw('ITEM', cols.item, y, 8, true, muted);
    draw('SIZE', cols.size, y, 8, true, muted);
    draw('QTY', cols.qty, y, 8, true, muted);
    draw('UNIT PRICE', cols.unit, y, 8, true, muted);
    const amtW = bold.widthOfTextAtSize('AMOUNT', 8);
    draw('AMOUNT', cols.amt - amtW, y, 8, true, muted);
    y -= 6;
    hline(y);
    y -= rowH;
  };

  draw('ITEMS', M, y, 9, true, muted);
  y -= 16;
  tableHeader();

  items.forEach((it, idx) => {
    // Page break when running out of room (leave space for totals + footer)
    if (y < 190) {
      page = doc.addPage([A4.w, A4.h]);
      y = A4.h - M;
      draw(`${order.order_number} - continued`, M, y, 8, false, muted);
      y -= 28;
      tableHeader();
    }

    draw(String(idx + 1), cols.no, y, 9, false, muted);
    let title = String(it.product_title || '');
    while (title.length > 2 && regular.widthOfTextAtSize(safe(title), 10) > cols.size - cols.item - 12) {
      title = title.slice(0, -2);
    }
    if (title !== String(it.product_title || '')) title += '...';
    draw(title, cols.item, y, 10, true);
    draw(it.size_label, cols.size, y, 9);
    draw(String(it.quantity), cols.qty, y, 9);
    draw(inr(it.price), cols.unit, y, 9);
    const amtW2 = bold.widthOfTextAtSize(inr(it.total), 10);
    draw(inr(it.total), cols.amt - amtW2, y, 10, true);
    y -= rowH;
    hline(y + 6, line, 0.5);
  });

  y -= 10;

  // ---------- Totals ----------
  const totals = [['Subtotal', inr(order.subtotal)]];
  if (Number(order.discount_amount) > 0) totals.push(['Discount', '- ' + inr(order.discount_amount)]);
  totals.push(['Shipping', Number(order.shipping_fee) > 0 ? inr(order.shipping_fee) : 'Free']);
  totals.push(['GRAND TOTAL', inr(order.total_amount)]);

  const labelX = A4.w - M - 200;
  const valRight = A4.w - M;

  for (const [label, val] of totals) {
    const isTotal = label === 'GRAND TOTAL';
    if (isTotal) hline(y + 16, ink, 1.5);
    draw(label, labelX, y, isTotal ? 11 : 10, isTotal, isTotal ? ink : muted);
    const valW = (isTotal ? bold : regular).widthOfTextAtSize(val, isTotal ? 12 : 10);
    draw(val, valRight - valW, y, isTotal ? 12 : 10, isTotal);
    y -= isTotal ? 22 : 18;
  }

  // ---------- Gift note ----------
  if (order.gift_message) {
    y -= 8;
    draw('GIFT NOTE', M, y, 8, true, muted);
    const giftLines = wrap(order.gift_message, 9, A4.w - M * 2);
    giftLines.forEach((l, i) => draw(l, M, y - 14 - i * 12, 9));
    y -= 14 + giftLines.length * 12;
  }

  // ---------- Footer (pinned near the bottom of the last page) ----------
  draw('Thank you for shopping with KATHRAZ Fragrances.', M, 64, 9, false, muted);
  draw('This is a computer-generated invoice.', M, 52, 9, false, muted);
  draw(`(c) ${new Date().getFullYear()} KATHRAZ FRAGRANCES INDIA`, M, 40, 8, false, muted);

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

module.exports = { buildInvoicePdf };
