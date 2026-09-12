const { Pool, types } = require('pg');
require('dotenv').config();
const bcrypt = require('bcryptjs');

// pg returns NUMERIC (1700) and BIGINT (20, e.g. COUNT(*)) as strings by default.
// Parse them as numbers so existing code like `count === 0` and SUM() keep working.
types.setTypeParser(1700, (val) => parseFloat(val));
types.setTypeParser(20, (val) => parseInt(val, 10));

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Add it to your .env file (Supabase Dashboard -> Project Settings -> Database -> Connection string).'
  );
}

const isLocal = /@(localhost|127\.0\.0\.1|\[::1\])/.test(connectionString);
const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

// Convert sqlite-style `?` placeholders to Postgres `$1, $2, ...`
function toPgSql(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

// Mimics sqlite3's run: resolves with { changes, lastID }.
// INSERTs automatically get `RETURNING id` appended so `result.lastID` keeps working.
const runQuery = async (sql, params = []) => {
  let text = toPgSql(sql);
  if (/^\s*INSERT\b/i.test(text) && !/\bRETURNING\b/i.test(text)) {
    text += ' RETURNING id';
  }
  const res = await pool.query(text, params);
  return {
    changes: res.rowCount,
    lastID: res.rows.length > 0 && res.rows[0] && res.rows[0].id != null ? res.rows[0].id : null,
  };
};

// Mimics sqlite3's get: resolves with the first row or null.
const getQuery = async (sql, params = []) => {
  const res = await pool.query(toPgSql(sql), params);
  return res.rows[0] || null;
};

// Mimics sqlite3's all: resolves with all rows.
const allQuery = async (sql, params = []) => {
  const res = await pool.query(toPgSql(sql), params);
  return res.rows;
};

async function initDatabase() {
  console.log('Initializing KATHRAZ database schema (Supabase Postgres)...');

  // Users Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'customer',
      phone TEXT,
      address TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Categories Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      image_url TEXT
    )
  `);

  // Products Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      subtitle TEXT,
      description TEXT,
      category_id INTEGER REFERENCES categories(id),
      base_price REAL NOT NULL,
      sale_price REAL,
      is_featured SMALLINT DEFAULT 0,
      is_bestseller SMALLINT DEFAULT 0,
      gender TEXT DEFAULT 'Unisex',
      concentration TEXT,
      top_notes TEXT,
      heart_notes TEXT,
      base_notes TEXT,
      longevity TEXT DEFAULT '12+ Hours',
      sillage TEXT DEFAULT 'Intense',
      image_url TEXT NOT NULL,
      gallery_json TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Product Variants Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS variants (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      size_label TEXT NOT NULL,
      price REAL NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      stock_quantity INTEGER DEFAULT 50
    )
  `);

  // Inventory Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS inventory (
      id SERIAL PRIMARY KEY,
      variant_id INTEGER UNIQUE NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
      stock_quantity INTEGER DEFAULT 50,
      reorder_level INTEGER DEFAULT 10,
      last_restocked TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Coupons Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS coupons (
      id SERIAL PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT NOT NULL,
      discount_value REAL NOT NULL,
      min_order_value REAL DEFAULT 0,
      usage_limit INTEGER DEFAULT 100,
      times_used INTEGER DEFAULT 0,
      expires_at TIMESTAMPTZ,
      active SMALLINT DEFAULT 1
    )
  `);

  // Orders Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      user_id INTEGER REFERENCES users(id),
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      phone TEXT NOT NULL,
      payment_method TEXT DEFAULT 'Razorpay',
      payment_status TEXT DEFAULT 'Paid',
      order_status TEXT DEFAULT 'Confirmed',
      subtotal REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      shipping_fee REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      tracking_number TEXT,
      courier_name TEXT DEFAULT 'Royal Express Logistics',
      gift_message TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Order Items Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      variant_id INTEGER REFERENCES variants(id),
      product_title TEXT NOT NULL,
      size_label TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      total REAL NOT NULL
    )
  `);

  // Payments Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id),
      razorpay_order_id TEXT,
      razorpay_payment_id TEXT,
      razorpay_signature TEXT,
      payment_status TEXT DEFAULT 'SUCCESS',
      amount REAL NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Reviews Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id),
      user_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      title TEXT,
      comment TEXT NOT NULL,
      verified_purchase SMALLINT DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Wishlists Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS wishlists (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, product_id)
    )
  `);

  await seedInitialData();
}

async function seedInitialData() {
  // Check if users already seeded
  const userCount = await getQuery('SELECT COUNT(*) as count FROM users');
  if (parseInt(userCount.count, 10) === 0) {
    console.log('Seeding initial users...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const customerPassword = await bcrypt.hash('customer123', 10);

    await runQuery(
      `INSERT INTO users (name, email, password_hash, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        'KATHRAZ Admin',
        'admin@kathraz.com',
        adminPassword,
        'admin',
        '+91 98765 43210',
        'Heritage Distillery Lane, Perfume Bazaar, Kannauj, UP'
      ]
    );

    await runQuery(
      `INSERT INTO users (name, email, password_hash, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        'Tariq Al-Mansoor',
        'customer@kathraz.com',
        customerPassword,
        'customer',
        '+91 98765 43210',
        '74 Park Avenue, Bandra West, Mumbai, MH'
      ]
    );
  }

  // Check if categories seeded
  const catCount = await getQuery('SELECT COUNT(*) as count FROM categories');
  if (parseInt(catCount.count, 10) === 0) {
    console.log('Seeding categories...');
    await runQuery(`
      INSERT INTO categories (id, name, slug, description, image_url) VALUES
      (1, 'Personal Fragrances', 'personal-fragrances', 'Extrait de Parfum & Haute Parfumerie oils formulated for intense longevity.', '/images/oud_royal.jpg')
    `);
  }

  // Check if products seeded
  const prodCount = await getQuery('SELECT COUNT(*) as count FROM products');
  if (parseInt(prodCount.count, 10) === 0) {
    console.log('Seeding luxury products...');

    // Product 1: Oud Royal
    const res1 = await runQuery(`
      INSERT INTO products (title, slug, subtitle, description, category_id, base_price, sale_price, is_featured, is_bestseller, gender, concentration, top_notes, heart_notes, base_notes, longevity, sillage, image_url, gallery_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'KATHRAZ Oud Royal',
      'kathraz-oud-royal',
      'Smokey Cambodian Agarwood & Damask Rose',
      'An opulent masterpiece steeped in centuries of Middle Eastern perfume heritage. Formulated with aged 25-year Cambodian Oud resin, infused with rare Taif rose and velvety cardamom. A signature scent of regal power and unforgettable sillage.',
      1,
      14500,
      12900,
      1,
      1,
      'Unisex',
      'Extrait de Parfum (35% Concentration)',
      'Royal Saffron, Guatemalan Cardamom, Wild Bergamot',
      'Taif Rose, Aged Cambodian Oud, Incense Smoke',
      'Rich Ambergris, Leather Accord, Dark Patchouli, Sandalwood',
      '16+ Hours',
      'Enormous',
      '/images/oud_royal.jpg',
      JSON.stringify(['/images/oud_royal.jpg', '/images/saffron_imperial.jpg'])
    ]);

    const p1Id = res1.lastID;

    // Variants P1
    await runQuery(`INSERT INTO variants (product_id, size_label, price, sku, stock_quantity) VALUES (?, ?, ?, ?, ?)`, [p1Id, '50ml Extrait', 12900, 'KATH-OUD-50', 35]);
    await runQuery(`INSERT INTO variants (product_id, size_label, price, sku, stock_quantity) VALUES (?, ?, ?, ?, ?)`, [p1Id, '100ml Extrait', 18500, 'KATH-OUD-100', 20]);
    await runQuery(`INSERT INTO variants (product_id, size_label, price, sku, stock_quantity) VALUES (?, ?, ?, ?, ?)`, [p1Id, '12ml Royal Attar Oil', 8900, 'KATH-OUD-ATTAR', 40]);

    // Product 2: Velvet Rose & Amber
    const res2 = await runQuery(`
      INSERT INTO products (title, slug, subtitle, description, category_id, base_price, sale_price, is_featured, is_bestseller, gender, concentration, top_notes, heart_notes, base_notes, longevity, sillage, image_url, gallery_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'KATHRAZ Velvet Rose & Amber',
      'velvet-rose-amber',
      'French Crimson Petals & Warm Baltic Amber',
      'A deeply seductive blend that wraps the wearer in cashmere-soft rose, honeyed amber, and sweet vanilla pod. Crafted for intimate evenings and unforgettable presence.',
      1,
      11200,
      9800,
      1,
      1,
      'For Her',
      'Eau de Parfum',
      'Pink Peppercorn, Juicy Lychee, Mandarin Blossom',
      'Crimson Damask Rose, Bulgarian Rose Absolute, Iris',
      'Golden Baltic Amber, Madagascar Vanilla, Creamy Tonka Bean',
      '12+ Hours',
      'Strong',
      '/images/velvet_rose.jpg',
      JSON.stringify(['/images/velvet_rose.jpg'])
    ]);

    const p2Id = res2.lastID;
    await runQuery(`INSERT INTO variants (product_id, size_label, price, sku, stock_quantity) VALUES (?, ?, ?, ?, ?)`, [p2Id, '50ml EDP', 9800, 'KATH-ROSE-50', 50]);
    await runQuery(`INSERT INTO variants (product_id, size_label, price, sku, stock_quantity) VALUES (?, ?, ?, ?, ?)`, [p2Id, '100ml EDP', 14200, 'KATH-ROSE-100', 30]);

    // Product 3: Saffron Imperial
    const res3 = await runQuery(`
      INSERT INTO products (title, slug, subtitle, description, category_id, base_price, sale_price, is_featured, is_bestseller, gender, concentration, top_notes, heart_notes, base_notes, longevity, sillage, image_url, gallery_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'KATHRAZ Saffron Imperial',
      'saffron-imperial',
      'Crimson Persian Saffron & Cedarwood',
      'Known as red gold, authentic Persian saffron meets smoking dry cedar and golden honeyed amber. Sharp, regal, and intensely charismatic.',
      1,
      13500,
      13500,
      1,
      0,
      'Unisex',
      'Extrait de Parfum',
      'Kashmiri Saffron, Bitter Almond, Nutmeg',
      'Jasmine Sambac, Cedarwood, Warm Leather',
      'Golden Amber, Oakmoss, Cashmeran Wood',
      '14+ Hours',
      'Heavy',
      '/images/saffron_imperial.jpg',
      JSON.stringify(['/images/saffron_imperial.jpg'])
    ]);

    const p3Id = res3.lastID;
    await runQuery(`INSERT INTO variants (product_id, size_label, price, sku, stock_quantity) VALUES (?, ?, ?, ?, ?)`, [p3Id, '50ml Extrait', 13500, 'KATH-SAF-50', 25]);
    await runQuery(`INSERT INTO variants (product_id, size_label, price, sku, stock_quantity) VALUES (?, ?, ?, ?, ?)`, [p3Id, '100ml Extrait', 19000, 'KATH-SAF-100', 15]);

    // Seed initial coupons
    await runQuery(`
      INSERT INTO coupons (code, discount_type, discount_value, min_order_value, usage_limit, times_used, active) VALUES
      ('KATHRAZ10', 'percentage', 10, 3000, 500, 12, 1),
      ('ROYALVIP', 'percentage', 20, 10000, 100, 4, 1),
      ('WELCOME500', 'fixed', 500, 4000, 200, 18, 1)
    `);

    // Seed initial demo reviews
    await runQuery(`
      INSERT INTO reviews (product_id, user_name, rating, title, comment) VALUES
      (${p1Id}, 'His Highness Prince Z.', 5, 'Absolute Regal Excellence', 'The Oud quality is astonishing. Having collected Creed and Amouage for years, KATHRAZ Oud Royal surpasses them in sillage and depth. Truly regal.'),
      (${p1Id}, 'Dr. Ananya Sharma', 5, 'Unmatched Longevity', 'Sprayed this at 8 AM and could still smell warm amber and rose at midnight! Worth every single rupee.'),
      (${p2Id}, 'Sophia V.', 5, 'Sensual & Cashmere Soft', 'The rose is not synthetic at all. It feels like fresh damask petals dipped in warm golden amber.')
    `);

    // Seed initial orders for admin analytics
    const order1 = await runQuery(`
      INSERT INTO orders (order_number, user_id, customer_name, customer_email, shipping_address, phone, payment_method, payment_status, order_status, subtotal, discount_amount, shipping_fee, total_amount, tracking_number, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW() - INTERVAL '2 days')
    `, ['KTZ-89210', 2, 'Tariq Al-Mansoor', 'customer@kathraz.com', '74 Park Avenue, Bandra West, Mumbai, MH', '+91 98765 43210', 'Razorpay', 'Paid', 'Shipped', 12900, 1290, 0, 11610, 'KEX-908231']);

    await runQuery(`
      INSERT INTO order_items (order_id, product_id, variant_id, product_title, size_label, price, quantity, total)
      VALUES (?, ?, 1, 'KATHRAZ Oud Royal', '50ml Extrait', 12900, 1, 12900)
    `, [order1.lastID, p1Id]);

    const order2 = await runQuery(`
      INSERT INTO orders (order_number, user_id, customer_name, customer_email, shipping_address, phone, payment_method, payment_status, order_status, subtotal, discount_amount, shipping_fee, total_amount, tracking_number, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW() - INTERVAL '5 days')
    `, ['KTZ-89209', 2, 'Tariq Al-Mansoor', 'customer@kathraz.com', '74 Park Avenue, Bandra West, Mumbai, MH', '+91 98765 43210', 'Razorpay', 'Paid', 'Delivered', 9800, 0, 0, 9800, 'KEX-882711']);

    await runQuery(`
      INSERT INTO order_items (order_id, product_id, variant_id, product_title, size_label, price, quantity, total)
      VALUES (?, ?, 4, 'KATHRAZ Velvet Rose & Amber', '50ml EDP', 9800, 1, 9800)
    `, [order2.lastID, p2Id]);
  }
}

module.exports = {
  db: pool,
  runQuery,
  getQuery,
  allQuery,
  initDatabase
};
