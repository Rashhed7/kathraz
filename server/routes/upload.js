const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// In-memory storage; we forward the buffer straight to Supabase Storage.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.mimetype);
    cb(ok ? null : new Error('Only JPG, PNG, WebP or AVIF images are allowed'), ok);
  },
});

// Lazy singleton — only touches env at request time, so the server can boot
// without the key (upload endpoint returns a clear error instead of crashing).
let supabase = null;
function getSupabase() {
  if (!supabase) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env for image uploads');
    }
    supabase = createClient(url, key, { auth: { persistSession: false } });
  }
  return supabase;
}

const BUCKET = 'product-images';
const PUBLIC_URL_BASE = `${process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL}`.replace(/\/$/, '') + `/storage/v1/object/public/${BUCKET}`;

// POST /api/admin/upload — multipart field name: "image"
router.post('/upload', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file received' });
    }

    const client = getSupabase();

    // Ensure the bucket exists (first-run convenience; no-op afterwards).
    const { data: buckets, error: listErr } = await client.storage.listBuckets();
    if (listErr) {
      throw new Error(`Supabase Storage: ${listErr.message} — check SUPABASE_SERVICE_ROLE_KEY in .env`);
    }
    if (!buckets.find((b) => b.name === BUCKET)) {
      const { error: createErr } = await client.storage.createBucket(BUCKET, { public: true });
      if (createErr) throw createErr;
    }

    const ext = (req.file.originalname.match(/\.(jpe?g|png|webp|avif)$/i) || [, 'jpg'])[1]
      .toLowerCase().replace('jpeg', 'jpg');
    const objectName = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await client.storage
      .from(BUCKET)
      .upload(objectName, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '31536000',
        upsert: false,
      });
    if (error) throw error;

    const publicUrl = `${PUBLIC_URL_BASE}/${objectName}`;
    res.status(201).json({ url: publicUrl, path: objectName });
  } catch (err) {
    console.error('Image upload error:', err.message);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

// Turn multer errors (file too large, wrong type) into JSON, not HTML —
// otherwise the frontend can't read the error and shows a generic message.
router.use((err, req, res, next) => {
  if (err) {
    const msg = err.code === 'LIMIT_FILE_SIZE'
      ? 'Image is larger than 5 MB — please resize it first'
      : err.message || 'Upload failed';
    return res.status(400).json({ error: msg });
  }
  next();
});

module.exports = router;
