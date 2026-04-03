const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');

const { User } = require('../models/User');
const { authRequired } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Setup uploads directory for avatars
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname)),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();
const nodemailer = require('nodemailer');

async function sendResetEmail(to, token) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || `no-reply@${process.env.APP_DOMAIN || 'localhost'}`;
  const frontend = process.env.FRONTEND_URL || '';

  if (!host || !port || !user || !pass) {
    return false;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: { user, pass },
  });

  const resetUrl = `${frontend.replace(/\/$/, '')}/reset/${token}`;
  const text = `You requested a password reset. Click the link to reset your password: ${resetUrl}`;
  const html = `<p>You requested a password reset.</p><p><a href="${resetUrl}">Reset your password</a></p><p>If you didn't request this, ignore this email.</p>`;

  try {
    await transporter.sendMail({ from, to, subject: 'Reset your password', text, html });
    return true;
  } catch (err) {
    console.error('Failed to send reset email', err);
    return false;
  }
}

function signToken(user) {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn });
}

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  password: z.string().min(6).max(200),
});

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { message: 'Invalid input', details: parsed.error.flatten() } });
  }

  const { name, email, password } = parsed.data;
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ error: { message: 'Email already registered' } });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email: email.toLowerCase(), passwordHash, role: 'user' });

  const token = signToken(user);
  return res.json({ token, user });
});

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(200),
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { message: 'Invalid input' } });
  }

  const { email, password } = parsed.data;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ error: { message: 'Invalid credentials' } });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: { message: 'Invalid credentials' } });
  }

  const token = signToken(user);
  return res.json({ token, user });
});

router.post('/google', async (req, res) => {
  try {
    if (!googleClient) {
      return res.status(500).json({ error: { message: 'Google login not configured' } });
    }

    const { idToken } = req.body || {};
    if (!idToken) {
      return res.status(400).json({ error: { message: 'Missing idToken' } });
    }

    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({ 
        idToken, 
        audience: googleClientId 
      });
    } catch (err) {
      console.error('Google token verify error:', err.message);
      return res.status(401).json({ error: { message: 'Invalid Google token: ' + err.message } });
    }

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ error: { message: 'Invalid token payload' } });
    }

    const { email, email_verified, name, picture } = payload;
    if (!email || !email_verified) {
      return res.status(401).json({ error: { message: 'Email not verified by Google or missing' } });
    }

    const emailLower = email.toLowerCase();
    let user = await User.findOne({ email: emailLower });

    if (!user) {
      // Auto-create user from Google profile
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 10);
      user = await User.create({ 
        name: name || email,
        email: emailLower,
        passwordHash,
        avatar: picture || null,
        role: 'user'
      });
    }
    else {
      // If an existing user signs in via Google and Google provided a profile picture,
      // persist/update that picture so the frontend can show it in the navbar.
      try {
        if (picture && String(picture).trim() && user.avatar !== picture) {
          user.avatar = picture;
          await user.save();
        }
      } catch (e) {
        // non-fatal: continue without blocking login
        console.warn('Failed to update user avatar from Google profile', e && e.message);
      }
    }

    const token = signToken(user);
    return res.json({ token, user });
  } catch (err) {
    console.error('Google auth error:', err);
    return res.status(500).json({ error: { message: 'Server error: ' + err.message } });
  }
});

// Request a password reset. Generates a token and stores it on the user.
router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: { message: 'Email required' } });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Do not reveal whether email exists
      return res.json({ ok: true });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // Try to send email if SMTP is configured
    const sent = await sendResetEmail(user.email, token);

    // In development or when DEBUG_SEND_RESET is true, return token for testing
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_SEND_RESET === 'true') {
      return res.json({ ok: true, token, emailed: !!sent });
    }

    return res.json({ ok: true, emailed: !!sent });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: { message: 'Server error' } });
  }
});

// Reset password using the token
router.post('/reset', async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: { message: 'Invalid input' } });
    }

    const user = await User.findOne({ resetToken: token, resetExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ error: { message: 'Invalid or expired token' } });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetExpires = undefined;
    await user.save();

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: { message: 'Server error' } });
  }
});

router.get('/me', authRequired, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }
  return res.json({ user });
});

// Update profile fields
router.patch('/me', authRequired, async (req, res) => {
  const { name, email, phone, address } = req.body || {};
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ error: { message: 'Unauthorized' } });

  const { gender } = req.body || {};
  if (gender !== undefined) {
    if (gender === null || gender === '') {
      user.gender = undefined;
    } else if (['male', 'female', 'other', 'prefer_not_to_say'].includes(String(gender))) {
      user.gender = String(gender);
    }
  }
  if (email && email.toLowerCase() !== user.email) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: { message: 'Email already in use' } });
    user.email = email.toLowerCase();
  }
  if (name) user.name = String(name).trim();
  if (phone !== undefined) user.phone = String(phone).trim();
  if (address !== undefined) user.address = String(address).trim();

  await user.save();
  return res.json({ user });
});

// Change password
router.patch('/me/password', authRequired, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: { message: 'Invalid input' } });
  }
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ error: { message: 'Unauthorized' } });
  const ok = await require('bcryptjs').compare(currentPassword, user.passwordHash);
  if (!ok) return res.status(401).json({ error: { message: 'Current password incorrect' } });
  user.passwordHash = await require('bcryptjs').hash(newPassword, 10);
  await user.save();
  return res.json({ user });
});

// Upload avatar
router.post('/me/avatar', authRequired, upload.single('avatar'), async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ error: { message: 'Unauthorized' } });
  if (!req.file) return res.status(400).json({ error: { message: 'No file uploaded' } });
  // store path relative to server root
  user.avatar = `/uploads/${req.file.filename}`;
  await user.save();
  return res.json({ user });
});

// Export user data
router.get('/me/export', authRequired, async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(401).json({ error: { message: 'Unauthorized' } });
  delete user.passwordHash;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="user-${user._id}.json"`);
  return res.send(JSON.stringify(user, null, 2));
});

// Delete account
router.delete('/me', authRequired, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ error: { message: 'Unauthorized' } });
  await User.deleteOne({ _id: user._id });
  return res.json({ ok: true });
});

const registerAdminSchema = z.object({
  secret: z.string().min(1),
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  password: z.string().min(6).max(200),
});

router.post('/register-admin', async (req, res) => {
  const parsed = registerAdminSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { message: 'Invalid input' } });
  }

  const { secret, name, email, password } = parsed.data;
  if (!process.env.ADMIN_REGISTER_SECRET || secret !== process.env.ADMIN_REGISTER_SECRET) {
    return res.status(403).json({ error: { message: 'Forbidden' } });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ error: { message: 'Email already registered' } });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email: email.toLowerCase(), passwordHash, role: 'admin' });

  const token = signToken(user);
  return res.json({ token, user });
});

module.exports = { authRouter: router };
