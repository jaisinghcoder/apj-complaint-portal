const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');

const { User } = require('../models/User');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn });
}

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

router.get('/me', authRequired, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }
  return res.json({ user });
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
