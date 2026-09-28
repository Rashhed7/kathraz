const express = require('express');
const bcrypt = require('bcryptjs');
const { getQuery, allQuery, runQuery } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { sendEmail, sendEmailWithResult, resolveAlertRecipients, newOrderAlertEmail, orderStatusEmail } = require('../utils/mailer');

const router = express.Router();

// Turn a product title into a URL-friendly slug, e.g.
// "KATHRAZ Zahren Extrait" -> "kathraz-zahren-extrait".
function slugify(title) {
  return String(title)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// Slugs are UNIQUE in the products table. If another product already owns the
// requested slug, append -2, -3, ... until it's free (the admin's own row is
// excluded via excludeId so re-saving the same product never renames it).
async function findUniqueSlug(baseSlug, excludeId = null) {
  if (!baseSlug) return baseSlug;
  let candidate = baseSlug;
  let suffix = 2;
  while (true) {
    const clash = excludeId == null
      ? await getQuery('SELECT id FROM products WHERE slug = ?', [candidate])
      : await getQuery('SELECT id FROM products WHERE slug = ? AND id != ?', [candidate, excludeId]);
    if (!clash) return candidate;
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

// Apply auth & admin middleware to all admin endpoints
router.use(authenticateToken);
router.use(requireAdmin);

// "Money we actually earned": a cancelled order never brings in revenue.
// Takes a table alias so the same rule can be applied to joined queries.
function salesFilter(alias = '') {
  const p = alias ? `${alias}.` : '';
  return `(${p}payment_status = 'Paid' OR ${p}order_status != 'Cancelled')`;
}

// 1. Dashboard Analytics KPI + Profit & Loss
//     Revenue               = billed order totals (net of discounts, incl. shipping)
//     Cost of Goods (COGS)  = snapshotted unit cost x quantity for the same orders
//     Gross Profit          = Revenue - COGS
//     Expenses              = every row the admin logged in the Expenses tab
//     Net Profit            = Gross Profit - Expenses
router.get('/analytics', async (req, res) => {
  try {
    const totalRevenueRes = await getQuery(`SELECT SUM(total_amount) as total FROM orders WHERE ${salesFilter()}`);
    const totalOrdersRes = await getQuery(`SELECT COUNT(*) as total FROM orders`);
    const totalCustomersRes = await getQuery(`SELECT COUNT(*) as total FROM users WHERE role = 'customer'`);
    const totalProductsRes = await getQuery(`SELECT COUNT(*) as total FROM products`);
    const lowStockRes = await getQuery(`SELECT COUNT(*) as total FROM variants WHERE stock_quantity <= 10`);

    // Cost of the goods actually sold (uses the per-order snapshot, so past
    // profit stays stable when a product's cost price changes).
    const cogsRes = await getQuery(`
      SELECT SUM(oi.cost_price * oi.quantity) as total
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE ${salesFilter('o')}
    `);
    const expensesRes = await getQuery('SELECT SUM(amount) as total, COUNT(*) as entries FROM expenses');

    const totalRevenue = Number(totalRevenueRes.total) || 0;
    const costOfGoods = Number(cogsRes.total) || 0;
    const totalExpenses = Number(expensesRes.total) || 0;
    const grossProfit = totalRevenue - costOfGoods;
    const netProfit = grossProfit - totalExpenses;

    const recentOrders = await allQuery(`SELECT * FROM orders ORDER BY id DESC LIMIT 5`);
    const categorySales = await allQuery(`
      SELECT c.name as category, COUNT(oi.id) as total_items, SUM(oi.total) as total_sales
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      GROUP BY c.name
    `);

    // Where the money is going — expenses grouped by category.
    const expenseBreakdown = await allQuery(`
      SELECT category, COUNT(*) as entries, SUM(amount) as total
      FROM expenses
      GROUP BY category
      ORDER BY total DESC
    `);

    // Last 6 months of revenue / COGS / expenses so trends are visible.
    const monthlyRevenue = await allQuery(`
      SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') as month, SUM(total_amount) as revenue
      FROM orders
      WHERE ${salesFilter()}
        AND created_at >= date_trunc('month', NOW()) - INTERVAL '5 months'
      GROUP BY 1
    `);
    const monthlyCogs = await allQuery(`
      SELECT to_char(date_trunc('month', o.created_at), 'YYYY-MM') as month, SUM(oi.cost_price * oi.quantity) as cogs
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE ${salesFilter('o')}
        AND o.created_at >= date_trunc('month', NOW()) - INTERVAL '5 months'
      GROUP BY 1
    `);
    const monthlyExpenses = await allQuery(`
      SELECT to_char(date_trunc('month', expense_date), 'YYYY-MM') as month, SUM(amount) as expenses
      FROM expenses
      WHERE expense_date >= date_trunc('month', NOW()) - INTERVAL '5 months'
      GROUP BY 1
    `);

    const monthly = new Map();
    const touch = (month) => {
      if (!monthly.has(month)) monthly.set(month, { month, revenue: 0, cogs: 0, expenses: 0 });
      return monthly.get(month);
    };
    for (const r of monthlyRevenue) touch(r.month).revenue = Number(r.revenue) || 0;
    for (const r of monthlyCogs) touch(r.month).cogs = Number(r.cogs) || 0;
    for (const r of monthlyExpenses) touch(r.month).expenses = Number(r.expenses) || 0;
    const monthlyProfit = [...monthly.values()]
      .map((m) => ({ ...m, grossProfit: m.revenue - m.cogs, netProfit: m.revenue - m.cogs - m.expenses }))
      .sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      analytics: {
        totalRevenue,
        totalOrders: totalOrdersRes.total || 0,
        totalCustomers: totalCustomersRes.total || 0,
        totalProducts: totalProductsRes.total || 0,
        lowStockItems: lowStockRes.total || 0,
        costOfGoods,
        grossProfit,
        totalExpenses,
        expenseEntries: Number(expensesRes.entries) || 0,
        netProfit,
        // Margin on net profit; 0 when nothing has been sold yet.
        profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
      },
      recentOrders,
      categorySales,
      expenseBreakdown,
      monthlyProfit
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// 1b. Admin product list — same shape as the storefront list but WITH the
// internal cost_price, which the public /api/products endpoints never send.
router.get('/products', async (req, res) => {
  try {
    const products = await allQuery(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.is_featured DESC, p.id DESC
    `);
    for (const product of products) {
      product.variants = await allQuery('SELECT * FROM variants WHERE product_id = ? ORDER BY price ASC', [product.id]);
      if (product.gallery_json) {
        try {
          product.gallery = JSON.parse(product.gallery_json);
        } catch (e) {
          product.gallery = [product.image_url];
        }
      } else {
        product.gallery = [product.image_url];
      }
    }
    res.json({ products });
  } catch (error) {
    console.error('Admin fetch products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// 1c. Category Management — the store's collections. Admins create these so
// non-fragrance ranges (candles, gift sets, oils, accessories…) can be listed
// alongside perfume instead of everything landing in one fixed category.

async function findUniqueCategorySlug(baseSlug, excludeId = null) {
  const safe = baseSlug || 'category';
  let candidate = safe;
  let suffix = 2;
  while (true) {
    const clash = excludeId == null
      ? await getQuery('SELECT id FROM categories WHERE slug = ?', [candidate])
      : await getQuery('SELECT id FROM categories WHERE slug = ? AND id != ?', [candidate, excludeId]);
    if (!clash) return candidate;
    candidate = `${safe}-${suffix}`;
    suffix += 1;
  }
}

// List categories with how many products each holds
router.get('/categories', async (req, res) => {
  try {
    const categories = await allQuery(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.name ASC
    `);
    res.json({ categories });
  } catch (error) {
    console.error('Fetch categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create a category
router.post('/categories', async (req, res) => {
  try {
    const cleanName = String(req.body.name || '').trim();
    if (!cleanName) {
      return res.status(400).json({ error: 'A category name is required' });
    }

    const slug = await findUniqueCategorySlug(slugify(req.body.slug || cleanName));
    const result = await runQuery(
      `INSERT INTO categories (name, slug, description, image_url) VALUES (?, ?, ?, ?)`,
      [cleanName, slug, req.body.description || '', req.body.image_url || '']
    );
    const category = await getQuery('SELECT * FROM categories WHERE id = ?', [result.lastID]);
    res.status(201).json({ message: 'Category created', category });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Rename / re-describe a category
router.put('/categories/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await getQuery('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const cleanName = String(req.body.name ?? existing.name).trim();
    if (!cleanName) {
      return res.status(400).json({ error: 'A category name is required' });
    }

    // Re-slug on an explicit slug, or automatically when the name changed.
    // (Renaming to the same name must not churn already-published URLs.)
    let slug = existing.slug;
    if (typeof req.body.slug === 'string' && req.body.slug.trim() !== '') {
      slug = await findUniqueCategorySlug(slugify(req.body.slug), id);
    } else if (cleanName !== existing.name) {
      slug = await findUniqueCategorySlug(slugify(cleanName), id);
    }

    await runQuery(
      `UPDATE categories SET name = ?, slug = ?, description = ?, image_url = ? WHERE id = ?`,
      [cleanName, slug, req.body.description ?? existing.description ?? '', req.body.image_url ?? existing.image_url ?? '', id]
    );
    const category = await getQuery('SELECT * FROM categories WHERE id = ?', [id]);
    res.json({ message: 'Category updated', category });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete a category — refused while products still use it, so nothing is orphaned
router.delete('/categories/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const inUse = await getQuery('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [id]);
    if (parseInt(inUse.count, 10) > 0) {
      return res.status(400).json({
        error: `This category still holds ${inUse.count} product(s). Move or delete them first.`
      });
    }
    await runQuery('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// 2. Product Management (CRUD)
// Create Product
router.post('/products', async (req, res) => {
  try {
    const { title, subtitle, description, category_id, base_price, sale_price, gender, concentration, top_notes, heart_notes, base_notes, longevity, sillage, image_url, gallery, is_featured, is_bestseller, variants } = req.body;

    if (!title || !base_price || !category_id) {
      return res.status(400).json({ error: 'Title, original price, and category are required' });
    }

    const salePrice = sale_price === null || sale_price === '' || sale_price === undefined
      ? null
      : Number(sale_price);
    if (salePrice !== null && (Number.isNaN(salePrice) || salePrice <= 0)) {
      return res.status(400).json({ error: 'Offer price must be a positive number' });
    }
    if (salePrice !== null && salePrice >= Number(base_price)) {
      return res.status(400).json({ error: 'Offer price must be lower than the original price' });
    }

    // Slug: use the admin's custom slug when provided, otherwise derive it
    // from the title. Either way, guarantee uniqueness.
    const requestedSlug = typeof req.body.slug === 'string' ? slugify(req.body.slug) : '';
    const slug = await findUniqueSlug(requestedSlug || slugify(title));

    const result = await runQuery(`
      INSERT INTO products (title, slug, subtitle, description, category_id, base_price, sale_price, is_featured, is_bestseller, gender, concentration, top_notes, heart_notes, base_notes, longevity, sillage, image_url, gallery_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title,
      slug,
      subtitle || '',
      description || '',
      category_id,
      base_price,
      salePrice,
      is_featured ? 1 : 0,
      is_bestseller ? 1 : 0,
      // Fragrance-only fields are stored exactly as given (blank stays blank)
      // so non-perfume items don't inherit misleading perfume defaults.
      gender || '',
      concentration || '',
      top_notes || '',
      heart_notes || '',
      base_notes || '',
      longevity || '',
      sillage || '',
      image_url || '/images/oud_royal.jpg',
      JSON.stringify(
        Array.isArray(gallery) && gallery.length > 0
          ? gallery.filter((g) => typeof g === 'string' && g.trim() !== '')
          : [image_url || '/images/oud_royal.jpg']
      )
    ]);

    const productId = result.lastID;

    // Add variants if provided
    if (variants && Array.isArray(variants) && variants.length > 0) {
      const seen = new Set();
      for (let v of variants) {
        const sizeLabel = (v.size_label || '').trim();
        const vPrice = Number(v.price);
        if (!sizeLabel || Number.isNaN(vPrice) || vPrice <= 0) {
          return res.status(400).json({ error: 'Every size needs a name and a price greater than 0' });
        }
        const key = sizeLabel.toLowerCase();
        if (seen.has(key)) {
          return res.status(400).json({ error: `Duplicate size name: "${sizeLabel}"` });
        }
        seen.add(key);
        await runQuery(`
          INSERT INTO variants (product_id, size_label, price, sku, stock_quantity, cost_price)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [productId, sizeLabel, vPrice, v.sku || `KTZ-${productId}-${sizeLabel.replace(/\s+/g, '')}`, Math.max(0, parseInt(v.stock_quantity, 10) || 50), Math.max(0, Number(v.cost_price) || 0)]);
      }
    } else {
      // Default variant — priced at the effective (offer) price so the shop
      // shows the offer, not the original
      await runQuery(`
        INSERT INTO variants (product_id, size_label, price, sku, stock_quantity)
        VALUES (?, '50ml Standard', ?, ?, 50)
      `, [productId, salePrice !== null ? salePrice : base_price, `KTZ-${productId}-50ML`]);
    }

    const created = await getQuery('SELECT * FROM products WHERE id = ?', [productId]);
    res.status(201).json({ message: 'Product created successfully', product: created });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update Product
router.put('/products/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, subtitle, description, category_id, base_price, sale_price, gender, concentration, top_notes, heart_notes, base_notes, longevity, sillage, image_url, gallery, is_featured, is_bestseller, variants } = req.body;

    if (!title || base_price == null || !category_id) {
      return res.status(400).json({ error: 'Title, original price, and category are required' });
    }

    const basePrice = Number(base_price);
    // Accept null/''/undefined as "no offer"; otherwise must be a valid number
    const salePrice = sale_price === null || sale_price === '' || sale_price === undefined
      ? null
      : Number(sale_price);

    if (Number.isNaN(basePrice) || basePrice <= 0) {
      return res.status(400).json({ error: 'Original price must be a positive number' });
    }
    if (salePrice !== null && (Number.isNaN(salePrice) || salePrice <= 0)) {
      return res.status(400).json({ error: 'Offer price must be a positive number' });
    }
    if (salePrice !== null && salePrice >= basePrice) {
      return res.status(400).json({ error: 'Offer price must be lower than the original price' });
    }

    // Load the current row first: we need the OLD effective price to know
    // which variants were "following" it, and to preserve the gallery when
    // the client doesn't send one.
    const existing = await getQuery('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Slug resolution on update, in order of intent:
    //   1. Admin typed a custom slug in the editor  -> use it (uniquified).
    //   2. Title changed, no custom slug            -> regenerate from title
    //      so /product/<slug> never shows a stale name (the Zahren/reef bug).
    //   3. Title unchanged, no custom slug          -> keep the existing slug
    //      so already-published links keep working.
    let finalSlug = existing.slug;
    const requestedSlug = typeof req.body.slug === 'string' ? slugify(req.body.slug) : '';
    const fromTitle = slugify(title);
    if (requestedSlug) {
      finalSlug = await findUniqueSlug(requestedSlug, id);
    } else if (fromTitle && fromTitle !== existing.slug) {
      finalSlug = await findUniqueSlug(fromTitle, id);
    }

    // Gallery: array of image URLs. When the client doesn't send one, keep
    // the existing gallery untouched.
    let galleryJson = existing.gallery_json;
    if (Array.isArray(gallery)) {
      const cleaned = gallery.filter((g) => typeof g === 'string' && g.trim() !== '');
      if (cleaned.length > 0) {
        galleryJson = JSON.stringify(cleaned);
      } else if (image_url) {
        galleryJson = JSON.stringify([image_url]);
      }
    }

    await runQuery(`
      UPDATE products SET
        title = ?, slug = ?, subtitle = ?, description = ?, category_id = ?, base_price = ?, sale_price = ?,
        gender = ?, concentration = ?, top_notes = ?, heart_notes = ?, base_notes = ?,
        longevity = ?, sillage = ?, image_url = ?, gallery_json = ?, is_featured = ?, is_bestseller = ?
      WHERE id = ?
    `, [
      title, finalSlug, subtitle || '', description || '', category_id, basePrice, salePrice,
      gender || '', concentration || '', top_notes || '', heart_notes || '', base_notes || '',
      longevity || '', sillage || '', image_url, galleryJson, is_featured ? 1 : 0, is_bestseller ? 1 : 0, id
    ]);

    // Variant price sync — keeps the shop from ever showing a stale price.
    // 1) Smart-follow (always): variants priced at the OLD effective price
    //    (offer price, or original when no offer) follow the new one.
    //    Variants with custom per-size prices are preserved.
    const oldEffective = existing.sale_price != null ? Number(existing.sale_price) : Number(existing.base_price);
    const newEffective = salePrice !== null ? salePrice : basePrice;
    if (newEffective !== oldEffective) {
      await runQuery(
        `UPDATE variants SET price = ? WHERE product_id = ? AND price = ?`,
        [newEffective, id, oldEffective]
      );
    }

    // 2) Explicit size sync from the admin editor: update existing rows,
    //    insert new sizes, and delete removed ones.
    const warnings = [];
    if (Array.isArray(variants)) {
      const keepIds = [];
      for (const v of variants) {
        const sizeLabel = (v.size_label || '').trim();
        const vPrice = Number(v.price);
        const vStock = Math.max(0, parseInt(v.stock_quantity, 10) || 0);
        const vCost = Math.max(0, Number(v.cost_price) || 0);
        if (!sizeLabel || Number.isNaN(vPrice) || vPrice <= 0) {
          return res.status(400).json({ error: 'Every size needs a name and a price greater than 0' });
        }
        if (v.id) {
          await runQuery(
            `UPDATE variants SET size_label = ?, price = ?, stock_quantity = ?, cost_price = ? WHERE id = ? AND product_id = ?`,
            [sizeLabel, vPrice, vStock, vCost, v.id, id]
          );
          keepIds.push(v.id);
        } else {
          const ins = await runQuery(
            `INSERT INTO variants (product_id, size_label, price, sku, stock_quantity, cost_price)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [id, sizeLabel, vPrice, `KTZ-${id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase(), vStock, vCost]
          );
          keepIds.push(ins.lastID);
        }
      }

      // Delete sizes removed in the editor. Sizes referenced by past orders
      // cannot be deleted (order history keeps them) — report instead.
      const existingVariants = await allQuery('SELECT id, size_label FROM variants WHERE product_id = ?', [id]);
      for (const ev of existingVariants) {
        if (!keepIds.includes(ev.id)) {
          try {
            await runQuery('DELETE FROM variants WHERE id = ? AND product_id = ?', [ev.id, id]);
          } catch (e) {
            warnings.push(`Size "${ev.size_label}" has past orders and was kept`);
          }
        }
      }
    }

    const updated = await getQuery('SELECT * FROM products WHERE id = ?', [id]);
    res.json({ message: 'Product updated successfully', product: updated, warnings });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete Product
router.delete('/products/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await runQuery('DELETE FROM products WHERE id = ?', [id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// 3. Order Management & Status Transitions
// List all orders for Admin
router.get('/orders', async (req, res) => {
  try {
    const orders = await allQuery('SELECT * FROM orders ORDER BY id DESC');
    for (let order of orders) {
      order.items = await allQuery('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    }
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin orders' });
  }
});

// Update Order Status (Pending -> Confirmed -> Processing -> Shipped -> Delivered)
router.put('/orders/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { order_status, tracking_number, courier_name, payment_status } = req.body;

    const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (order_status && !validStatuses.includes(order_status)) {
      return res.status(400).json({ error: 'Invalid order status transition' });
    }

    // Courier is written MANUALLY by the admin when marking an order Shipped.
    if (order_status === 'Shipped' && !courier_name) {
      const existing = await getQuery('SELECT courier_name FROM orders WHERE id = ?', [id]);
      if (!existing || !existing.courier_name) {
        return res.status(400).json({ error: 'Courier service name is required when marking an order Shipped' });
      }
    }

    let sql = 'UPDATE orders SET id = id';
    const params = [];

    if (order_status) {
      sql += ', order_status = ?';
      params.push(order_status);
    }

    if (tracking_number) {
      sql += ', tracking_number = ?';
      params.push(tracking_number);
    }

    if (courier_name) {
      sql += ', courier_name = ?';
      params.push(courier_name);
    }

    if (payment_status) {
      sql += ', payment_status = ?';
      params.push(payment_status);
    }

    sql += ' WHERE id = ?';
    params.push(id);

    await runQuery(sql, params);

    const updated = await getQuery('SELECT * FROM orders WHERE id = ?', [id]);

    // Customer email on every status change (async, never blocks the admin UI).
    // Skipped when nothing meaningful changed (e.g. only a re-save).
    if (updated) {
      const items = await allQuery('SELECT * FROM order_items WHERE order_id = ?', [id]);
      const { subject, html, text } = orderStatusEmail({
        order: updated,
        items,
        newStatus: updated.order_status,
        paymentStatus: updated.payment_status,
        trackingNumber: tracking_number,
        courierName: courier_name,
      });
      // Awaited — on Cloudflare Workers the isolate is frozen once the
      // response is sent, so fire-and-forget fetches are killed silently.
      try {
        await sendEmail({ to: updated.customer_email, subject, html, text });
      } catch (emailErr) {
        console.error('[status-email] failed:', emailErr.message);
      }
    }

    res.json({ message: `Order status updated to ${updated.order_status}`, order: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' })
  }
});

// Delete an order entirely (admin cleanup: test orders, mistakes).
// Also removes its items + payment records and RESTORES the stock that was
// deducted when the order was placed.
router.delete('/orders/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const order = await getQuery('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Restore stock for every item in this order.
    const items = await allQuery('SELECT variant_id, quantity FROM order_items WHERE order_id = ?', [id]);
    for (const item of items) {
      if (item.variant_id) {
        await runQuery(
          'UPDATE variants SET stock_quantity = stock_quantity + ? WHERE id = ?',
          [item.quantity, item.variant_id]
        );
      }
    }

    await runQuery('DELETE FROM payments WHERE order_id = ?', [id]);
    await runQuery('DELETE FROM order_items WHERE order_id = ?', [id]);
    await runQuery('DELETE FROM orders WHERE id = ?', [id]);

    res.json({ message: `Order ${order.order_number} deleted (stock restored)` });
  } catch (error) {
    console.error('Order delete error:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// 4. Customer Roster
router.get('/customers', async (req, res) => {
  try {
    const customers = await allQuery(`
      SELECT u.id, u.name, u.email, u.phone, u.address, u.created_at,
             COUNT(o.id) as total_orders,
             COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.role = 'customer'
      GROUP BY u.id
      ORDER BY total_spent DESC
    `);
    res.json({ customers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// 5. Coupon Management (CRUD)
router.get('/coupons', async (req, res) => {
  try {
    const coupons = await allQuery('SELECT * FROM coupons ORDER BY id DESC');
    res.json({ coupons });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

router.post('/coupons', async (req, res) => {
  try {
    const { code, discount_type, discount_value, min_order_value, usage_limit } = req.body;
    await runQuery(`
      INSERT INTO coupons (code, discount_type, discount_value, min_order_value, usage_limit, active)
      VALUES (?, ?, ?, ?, ?, 1)
    `, [code.toUpperCase().trim(), discount_type, discount_value, min_order_value || 0, usage_limit || 100]);
    res.status(201).json({ message: 'Coupon created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

router.delete('/coupons/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await runQuery('DELETE FROM coupons WHERE id = ?', [id]);
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

// 6. Instagram Feed Posts (Home page gallery)
router.get('/posts', async (req, res) => {
  try {
    const posts = await allQuery('SELECT * FROM instagram_posts ORDER BY position ASC, id DESC');
    res.json({ posts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

router.post('/posts', async (req, res) => {
  try {
    const { image_url, caption, link_url, media_type } = req.body;
    if (!image_url) {
      return res.status(400).json({ error: 'A video or image is required' });
    }
    // New posts go to the front of the feed
    const posRes = await getQuery('SELECT MIN(position) as minPos FROM instagram_posts');
    const position = posRes && posRes.minPos != null ? posRes.minPos - 1 : 0;
    const created = await runQuery(
      'INSERT INTO instagram_posts (image_url, caption, link_url, media_type, position) VALUES (?, ?, ?, ?, ?)',
      [image_url, caption || '', link_url || '', media_type === 'video' ? 'video' : 'image', position]
    );
    const post = await getQuery('SELECT * FROM instagram_posts WHERE id = ?', [created.lastID]);
    res.status(201).json({ message: 'Post added', post });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add post' });
  }
});

// Move a post one slot left/right in the feed
router.put('/posts/:id/move', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { direction } = req.body; // 'up' | 'down'
    const posts = await allQuery('SELECT id FROM instagram_posts ORDER BY position ASC, id DESC');
    const idx = posts.findIndex((p) => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Post not found' });
    const swapWith = direction === 'up' ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= posts.length) {
      return res.json({ message: 'Already at the edge' });
    }
    const a = posts[idx];
    const b = posts[swapWith];
    await runQuery('UPDATE instagram_posts SET position = ? WHERE id = ?', [swapWith, a.id]);
    await runQuery('UPDATE instagram_posts SET position = ? WHERE id = ?', [idx, b.id]);
    res.json({ message: 'Order updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reorder posts' });
  }
});

router.delete('/posts/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await runQuery('DELETE FROM instagram_posts WHERE id = ?', [id]);
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// 7. Ad Banners (Home page spotlight)
router.get('/ads', async (req, res) => {
  try {
    const ads = await allQuery('SELECT * FROM ad_banners ORDER BY position ASC, id ASC');
    res.json({ ads });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ads' });
  }
});

router.post('/ads', async (req, res) => {
  try {
    const { image_url, headline, subtext, link_url } = req.body;
    if (!image_url) {
      return res.status(400).json({ error: 'An image is required' });
    }
    const posRes = await getQuery('SELECT MIN(position) as minPos FROM ad_banners');
    const position = posRes && posRes.minPos != null ? posRes.minPos - 1 : 0;
    const created = await runQuery(
      'INSERT INTO ad_banners (image_url, headline, subtext, link_url, position) VALUES (?, ?, ?, ?, ?)',
      [image_url, headline || '', subtext || '', link_url || '', position]
    );
    const ad = await getQuery('SELECT * FROM ad_banners WHERE id = ?', [created.lastID]);
    res.status(201).json({ message: 'Ad created', ad });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create ad' });
  }
});

// Move an ad one slot left/right in the rotation
router.put('/ads/:id/move', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { direction } = req.body; // 'up' | 'down'
    const ads = await allQuery('SELECT id FROM ad_banners ORDER BY position ASC, id ASC');
    const idx = ads.findIndex((a) => a.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Ad not found' });
    const swapWith = direction === 'up' ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= ads.length) {
      return res.json({ message: 'Already at the edge' });
    }
    const a = ads[idx];
    const b = ads[swapWith];
    await runQuery('UPDATE ad_banners SET position = ? WHERE id = ?', [swapWith, a.id]);
    await runQuery('UPDATE ad_banners SET position = ? WHERE id = ?', [idx, b.id]);
    res.json({ message: 'Order updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reorder ads' });
  }
});

// Show/hide an ad without deleting it
router.put('/ads/:id/toggle', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const ad = await getQuery('SELECT * FROM ad_banners WHERE id = ?', [id]);
    if (!ad) return res.status(404).json({ error: 'Ad not found' });
    await runQuery('UPDATE ad_banners SET active = ? WHERE id = ?', [ad.active === 1 ? 0 : 1, id]);
    res.json({ message: 'Ad updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ad' });
  }
});

router.delete('/ads/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await runQuery('DELETE FROM ad_banners WHERE id = ?', [id]);
    res.json({ message: 'Ad deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete ad' });
  }
});

// 7a. Email health check — sends a real alert to the configured recipients and
// reports exactly what the email provider said. Exists because a failed alert
// used to be invisible: a boolean was swallowed and nothing was logged.
router.post('/test-email', async (req, res) => {
  try {
    const recipients = await resolveAlertRecipients();
    if (recipients.length === 0) {
      return res.status(400).json({ error: 'No alert recipient is configured' });
    }

    const sample = {
      order_number: 'KTZ-TEST',
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      phone: '9999999999',
      shipping_address: 'Test email from the KATHRAZ admin dashboard — no action needed.',
      payment_method: 'COD',
      payment_status: 'Pending',
      subtotal: 0,
      discount_amount: 0,
      shipping_fee: 0,
      total_amount: 0,
    };
    const site = (process.env.PUBLIC_SITE_URL || '').replace(/\/$/, '');
    const mail = newOrderAlertEmail({
      order: sample,
      items: [],
      adminUrl: site ? `${site}/admin` : '',
    });

    const result = await sendEmailWithResult({
      to: recipients,
      subject: `[TEST] ${mail.subject}`,
      html: mail.html,
      text: `This is a test alert from your KATHRAZ admin dashboard.\n\n${mail.text}`,
    });

    res.json({
      sent: result.ok,
      recipients: result.recipients,
      sender: result.sender,
      configured: result.configured,
      provider_status: result.status,
      provider_message: result.providerMessage,
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

// 7b. Expense Tracking — everything the store spends to run (rent, ads,
// packaging, salaries …). Net profit = gross profit - these expenses.
const EXPENSE_CATEGORIES = ['General', 'Purchase / Stock', 'Marketing & Ads', 'Packaging', 'Shipping', 'Rent', 'Salaries', 'Utilities', 'Other'];

// List every logged expense, newest first
router.get('/expenses', async (req, res) => {
  try {
    const expenses = await allQuery(`
      SELECT e.*, u.name as created_by_name
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      ORDER BY e.expense_date DESC, e.id DESC
    `);
    const total = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    res.json({ expenses, total, categories: EXPENSE_CATEGORIES });
  } catch (error) {
    console.error('Fetch expenses error:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Log a new expense
router.post('/expenses', async (req, res) => {
  try {
    const { title, category, amount, expense_date, notes } = req.body;
    const cleanTitle = String(title || '').trim();
    const value = Number(amount);
    if (!cleanTitle) {
      return res.status(400).json({ error: 'A description is required' });
    }
    if (!Number.isFinite(value) || value <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const result = await runQuery(`
      INSERT INTO expenses (title, category, amount, expense_date, notes, created_by)
      VALUES (?, ?, ?, COALESCE(?, CURRENT_DATE), ?, ?)
    `, [cleanTitle, String(category || 'General').trim(), value, expense_date || null, notes || '', req.user.id]);

    const expense = await getQuery('SELECT * FROM expenses WHERE id = ?', [result.lastID]);
    res.status(201).json({ message: 'Expense added', expense });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

// Edit an expense
router.put('/expenses/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await getQuery('SELECT * FROM expenses WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const { title, category, amount, expense_date, notes } = req.body;
    const cleanTitle = String(title ?? existing.title).trim();
    const value = amount === undefined ? Number(existing.amount) : Number(amount);
    if (!cleanTitle) {
      return res.status(400).json({ error: 'A description is required' });
    }
    if (!Number.isFinite(value) || value <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    await runQuery(`
      UPDATE expenses
      SET title = ?, category = ?, amount = ?, expense_date = COALESCE(?, expense_date), notes = ?
      WHERE id = ?
    `, [cleanTitle, String(category ?? existing.category ?? 'General').trim(), value, expense_date || null, notes ?? existing.notes ?? '', id]);

    const expense = await getQuery('SELECT * FROM expenses WHERE id = ?', [id]);
    res.json({ message: 'Expense updated', expense });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Delete an expense
router.delete('/expenses/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await runQuery('DELETE FROM expenses WHERE id = ?', [id]);
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// 8. Admin Management — invite/manage fellow admins.
// Guardrails: you can't demote/delete yourself, and you can't demote or delete
// the LAST remaining admin — guarantees the store always keeps at least one.

// List all admin users
router.get('/admins', async (req, res) => {
  try {
    const admins = await allQuery(`
      SELECT id, name, email, phone, role, created_at
      FROM users
      WHERE role = 'admin'
      ORDER BY id ASC
    `);
    res.json({ admins });
  } catch (error) {
    console.error('List admins error:', error);
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

// Create a new admin. If the email already belongs to an existing CUSTOMER
// account, that account is PROMOTED to admin (name/phone/password updated to
// the provided values). Only a true duplicate admin is rejected.
router.post('/admins', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Admin password must be at least 8 characters' });
    }

    const normalized = String(email).toLowerCase().trim();
    const existing = await getQuery('SELECT id, name, role FROM users WHERE email = ?', [normalized]);

    if (existing && existing.role === 'admin') {
      return res.status(400).json({ error: 'That email is already an admin' });
    }

    const hashed = await bcrypt.hash(password, 10);

    if (existing) {
      // Promote the existing customer to admin with the new credentials.
      await runQuery(
        'UPDATE users SET name = ?, password_hash = ?, phone = ?, role = ?, reset_token_hash = NULL, reset_token_expires = NULL WHERE id = ?',
        [name.trim(), hashed, phone || '', 'admin', existing.id]
      );
      const admin = await getQuery('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?', [existing.id]);
      return res.status(201).json({ message: 'Existing account promoted to admin', admin });
    }

    const result = await runQuery(
      `INSERT INTO users (name, email, password_hash, role, phone, address)
       VALUES (?, ?, ?, 'admin', ?, '')`,
      [name.trim(), normalized, hashed, phone || '']
    );
    const admin = await getQuery('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?', [result.lastID]);
    res.status(201).json({ message: 'Admin created', admin });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

// Change an admin's role (currently: demote to 'customer')
router.put('/admins/:id/role', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { role } = req.body;
    if (!['admin', 'customer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const target = await getQuery('SELECT id, name, role FROM users WHERE id = ?', [id]);
    if (!target) return res.status(404).json({ error: 'User not found' });

    if (target.role === 'admin') {
      if (id === req.user.id) {
        return res.status(400).json({ error: "You can't change your own role — ask another admin to do it" });
      }
      const adminCount = await getQuery("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
      if (parseInt(adminCount.count, 10) <= 1) {
        return res.status(400).json({ error: 'Cannot demote the last remaining admin' });
      }
    }

    await runQuery('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.json({ message: `Role updated to ${role}` });
  } catch (error) {
    console.error('Change role error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// Reset an admin's password (also clears any pending password-reset token)
router.put('/admins/:id/password', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { password } = req.body;
    if (!password || String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const target = await getQuery('SELECT id, role FROM users WHERE id = ?', [id]);
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.role !== 'admin') {
      return res.status(400).json({ error: 'This user is not an admin' });
    }

    const hashed = await bcrypt.hash(password, 10);
    await runQuery(
      'UPDATE users SET password_hash = ?, reset_token_hash = NULL, reset_token_expires = NULL WHERE id = ?',
      [hashed, id]
    );
    res.json({ message: 'Password reset' });
  } catch (error) {
    console.error('Admin password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Delete an admin
router.delete('/admins/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const target = await getQuery('SELECT id, name, role FROM users WHERE id = ?', [id]);
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.role !== 'admin') {
      return res.status(400).json({ error: 'This user is not an admin' });
    }
    if (id === req.user.id) {
      return res.status(400).json({ error: "You can't delete your own account" });
    }

    const adminCount = await getQuery("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    if (parseInt(adminCount.count, 10) <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last remaining admin' });
    }

    await runQuery('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'Admin removed' });
  } catch (error) {
    // FK constraint: admin has orders/wishlists attached
    if (String(error.message).includes('FOREIGN KEY')) {
      return res.status(400).json({ error: 'This admin has orders or wishlist items attached — demote to customer instead of deleting.' });
    }
    console.error('Delete admin error:', error);
    res.status(500).json({ error: 'Failed to delete admin' });
  }
});

module.exports = router;
