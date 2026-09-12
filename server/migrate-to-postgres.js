// One-time migration: copy data from local SQLite (server/kathraz_database.sqlite)
// into the Supabase Postgres database (DATABASE_URL in .env).
// Safe to re-run: it skips tables that already contain rows.
// Run with:  node server/migrate-to-postgres.js

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const { initDatabase } = require('./database');

const SQLITE_PATH = path.resolve(__dirname, 'kathraz_database.sqlite');
const sqlite = new sqlite3.Database(SQLITE_PATH);

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERROR: DATABASE_URL is not set in .env');
  process.exit(1);
}

const isLocal = /@(localhost|127\.0\.0\.1|\[::1\])/.test(connectionString);
const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

const q = (sql, params = []) =>
  new Promise((resolve, reject) =>
    sqlite.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)))
  );

const toPg = (sql) => {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
};

async function migrateTable(name, columns, transform = (r) => r) {
  const rows = await q(`SELECT * FROM ${name}`);
  let count = 0;
  for (const row of rows) {
    const data = transform(row);
    const vals = columns.map((c) => data[c] !== undefined ? data[c] : null);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    await pool.query(
      `INSERT INTO ${name} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
      vals
    );
    count++;
  }
  console.log(`- ${name}: migrated ${count} rows`);
}

// Booleans/int flags in Postgres are SMALLINT — sqlite INTEGER maps 1:1.
// Dates come back from sqlite as strings, which Postgres accepts for TIMESTAMPTZ.
async function fixSequences() {
  // After inserting explicit IDs, sync the SERIAL sequences so new inserts don't collide.
  const tables = ['users', 'categories', 'products', 'variants', 'inventory', 'coupons',
    'orders', 'order_items', 'payments', 'reviews', 'wishlists'];
  for (const t of tables) {
    await pool.query(`
      SELECT setval(pg_get_serial_sequence('${t}', 'id'),
        COALESCE((SELECT MAX(id) FROM ${t}), 1))
    `);
  }
  console.log('- sequences synced');
}

async function main() {
  console.log('Migrating SQLite -> Supabase Postgres...');
  try {
    // 1. Create schema (and the auto-seed that comes with it)
    await initDatabase();

    // 2. Wipe the auto-seeded demo data so the cloud DB becomes an exact copy
    //    of your local SQLite database. Safe: Supabase DB is brand new.
    console.log('Clearing auto-seeded demo data...');
    await pool.query(`TRUNCATE users, categories, products, variants, inventory,
      coupons, orders, order_items, payments, reviews, wishlists RESTART IDENTITY CASCADE`);

    // 3. Copy every table
    await migrateTable('users',
      ['id', 'name', 'email', 'password_hash', 'role', 'phone', 'address', 'created_at']);
    await migrateTable('categories',
      ['id', 'name', 'slug', 'description', 'image_url']);
    await migrateTable('products',
      ['id', 'title', 'slug', 'subtitle', 'description', 'category_id', 'base_price', 'sale_price',
       'is_featured', 'is_bestseller', 'gender', 'concentration', 'top_notes', 'heart_notes',
       'base_notes', 'longevity', 'sillage', 'image_url', 'gallery_json', 'created_at']);
    await migrateTable('variants',
      ['id', 'product_id', 'size_label', 'price', 'sku', 'stock_quantity']);
    await migrateTable('inventory',
      ['id', 'variant_id', 'stock_quantity', 'reorder_level', 'last_restocked']);
    await migrateTable('coupons',
      ['id', 'code', 'discount_type', 'discount_value', 'min_order_value', 'usage_limit',
       'times_used', 'expires_at', 'active']);
    await migrateTable('orders',
      ['id', 'order_number', 'user_id', 'customer_name', 'customer_email', 'shipping_address',
       'phone', 'payment_method', 'payment_status', 'order_status', 'subtotal', 'discount_amount',
       'shipping_fee', 'total_amount', 'tracking_number', 'courier_name', 'gift_message', 'created_at']);
    await migrateTable('order_items',
      ['id', 'order_id', 'product_id', 'variant_id', 'product_title', 'size_label', 'price',
       'quantity', 'total']);
    await migrateTable('payments',
      ['id', 'order_id', 'razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature',
       'payment_status', 'amount', 'created_at']);
    await migrateTable('reviews',
      ['id', 'product_id', 'user_id', 'user_name', 'rating', 'title', 'comment',
       'verified_purchase', 'created_at']);
    await migrateTable('wishlists',
      ['id', 'user_id', 'product_id', 'created_at']);
    await fixSequences();
    console.log('✅ Migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    sqlite.close();
    await pool.end();
  }
}

main();
