const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { getQuery, runQuery, allQuery } = require('../database');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');
const { sendEmail, passwordResetEmail } = require('../utils/mailer');

const router = express.Router();

// Google Sign-In client — verifies ID tokens issued by Google Identity Services.
// GOOGLE_CLIENT_ID must match the one the frontend button uses.
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register Customer
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await getQuery('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) {
      return res.status(400).json({ error: 'Email address already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await runQuery(
      `INSERT INTO users (name, email, password_hash, role, phone, address) VALUES (?, ?, ?, 'customer', ?, ?)`,
      [name, email.toLowerCase().trim(), hashedPassword, phone || '', address || '']
    );

    const newUser = await getQuery('SELECT id, name, email, role, phone, address FROM users WHERE id = ?', [result.lastID]);
    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await getQuery('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Default admin claim: keep the store owner's account on the admin role
    // even if it was demoted or created as a customer by mistake.
    const OWNER_EMAIL = 'rasheedabdulrasheed@gmail.com';
    if (normalizedEmail === OWNER_EMAIL && user.role !== 'admin') {
      await runQuery(`UPDATE users SET role = 'admin' WHERE id = ?`, [user.id]);
      user.role = 'admin';
      console.log(`[auth] Default admin claim applied: ${normalizedEmail} promoted to admin`);
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address
    };

    res.json({
      message: 'Logged in successfully',
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Google Sign-In — the frontend sends the credential (ID token) from the
// Google button; we verify it with Google, then upsert a local user and
// issue our standard JWT so the rest of the app works unchanged.
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: 'Google sign-in is not configured' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const profile = ticket.getPayload();
    if (!profile || !profile.email) {
      return res.status(400).json({ error: 'Could not read the Google account' });
    }

    const email = profile.email.toLowerCase().trim();
    let user = await getQuery('SELECT * FROM users WHERE email = ?', [email]);

    // Default admin claim: the store owner's email always gets the admin role.
    // If they sign in with Google before the seeded admin account exists, the
    // OAuth-created account is created as admin directly; otherwise an existing
    // customer-role row is promoted on the fly. Regular customers are unaffected.
    const OWNER_EMAIL = 'rasheedabdulrasheed@gmail.com';
    const isOwner = email === OWNER_EMAIL;

    if (!user) {
      // Random password hash — the account is OAuth-only unless reset
      const randomHash = await bcrypt.hash(jwt.sign({ sub: profile.sub }, JWT_SECRET), 10);
      const result = await runQuery(
        `INSERT INTO users (name, email, password_hash, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)`,
        [profile.name || email.split('@')[0], email, randomHash, isOwner ? 'admin' : 'customer', '', '']
      );
      user = await getQuery('SELECT * FROM users WHERE id = ?', [result.lastID]);
    } else if (isOwner && user.role !== 'admin') {
      await runQuery(`UPDATE users SET role = 'admin' WHERE id = ?`, [user.id]);
      user.role = 'admin';
      console.log(`[auth] Default admin claim applied: ${email} promoted to admin`);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Logged in with Google',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (error) {
    console.error('Google sign-in error:', error.message);
    res.status(401).json({ error: 'Google sign-in failed. Please try again or use email sign-in.' });
  }
});

// Get Current User
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await getQuery('SELECT id, name, email, role, phone, address, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update Profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    await runQuery('UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?', [name, phone, address, req.user.id]);
    const updated = await getQuery('SELECT id, name, email, role, phone, address FROM users WHERE id = ?', [req.user.id]);
    res.json({ message: 'Profile updated successfully', user: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ==================== PASSWORD RESET ====================
//
// Flow: user submits email -> we issue a single-use token (random 32 bytes,
// stored only as a SHA-256 hash with a 30-minute expiry) and email the plain
// link. The reset endpoint consumes the token and swaps the password.
//
// Anti-enumeration: the response is always the same "If that email exists…"
// message whether or not the account exists — attackers can't probe which
// emails are registered.

const RESET_TOKEN_TTL_MINUTES = 30;

// POST /api/auth/forgot-password  { email }
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalized = String(email).toLowerCase().trim();
    const user = await getQuery('SELECT id, name FROM users WHERE email = ?', [normalized]);

    const GENERIC_MSG =
      'If an account exists for that email, a password reset link has been sent.';

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');

      await runQuery(
        `UPDATE users SET reset_token_hash = ?, reset_token_expires = NOW() + INTERVAL '${RESET_TOKEN_TTL_MINUTES} minutes' WHERE id = ?`,
        [hashResetToken(token), user.id]
      );

      const origin = process.env.PUBLIC_SITE_URL || `${req.protocol}://${req.get('host')}`;
      const resetUrl = `${origin}/reset-password?token=${token}`;

      const { subject, html, text } = passwordResetEmail({
        name: user.name,
        resetUrl,
        minutes: RESET_TOKEN_TTL_MINUTES,
      });
      const sent = await sendEmail({ to: normalized, subject, html, text });

      if (!sent) {
        // Brevo not configured or failed. Don't leak that to the outside world,
        // but make it visible in logs so misconfiguration gets noticed.
        console.error(`[forgot-password] Email delivery FAILED for ${normalized}`);
      }
    }

    res.json({ message: GENERIC_MSG });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/reset-password  { token, password }
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const tokenHash = hashResetToken(token);
    const user = await getQuery(
      `SELECT id, email FROM users
       WHERE reset_token_hash = ?
         AND reset_token_expires > NOW()`,
      [tokenHash]
    );

    if (!user) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired. Please request a new one.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await runQuery(
      `UPDATE users SET password_hash = ?, reset_token_hash = NULL, reset_token_expires = NULL WHERE id = ?`,
      [hashedPassword, user.id]
    );

    // Best-effort confirmation email (never blocks the response).
    sendEmail({
      to: user.email,
      subject: 'Your KATHRAZ password was changed',
      text: `Hi ${user.name}, the password for your KATHRAZ account was just changed. If this wasn't you, contact support immediately.`,
    }).catch(() => {});

    res.json({ message: 'Password updated successfully. You can now sign in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

function hashResetToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

module.exports = router;
