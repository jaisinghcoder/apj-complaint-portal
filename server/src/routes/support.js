const express = require('express');
const { z } = require('zod');
const mongoose = require('mongoose');

const { Support } = require('../models/Support');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

const createSchema = z.object({
  subject: z.string().min(2).max(200),
  message: z.string().min(5).max(4000),
  category: z.string().max(100).optional(),
});

router.post('/', authRequired, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { message: 'Invalid input', details: parsed.error.flatten() } });

  const { subject, message, category } = parsed.data;
  const userId = new mongoose.Types.ObjectId(req.user.id);

  const ticket = await Support.create({
    user: userId,
    subject,
    message,
    category: category || 'General',
  });

  return res.status(201).json({ ticket });
});

router.get('/', authRequired, async (req, res) => {
  const filter = {};
  if (req.user.role !== 'admin') filter.user = req.user.id;

  let query = Support.find(filter).sort({ createdAt: -1 }).limit(200);
  if (req.user.role === 'admin') query = query.populate('user', 'name email');

  const tickets = await query;
  return res.json({ tickets });
});

router.get('/:id', authRequired, async (req, res) => {
  const ticket = await Support.findById(req.params.id).populate('user', 'name email role');
  if (!ticket) return res.status(404).json({ error: { message: 'Not found' } });
  if (req.user.role !== 'admin' && ticket.user._id.toString() !== req.user.id) return res.status(403).json({ error: { message: 'Forbidden' } });
  return res.json({ ticket });
});

const statusSchema = z.object({ status: z.enum(['Open', 'Pending', 'Closed']), reply: z.string().max(4000).optional() });

router.patch('/:id/status', authRequired, requireRole('admin'), async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { message: 'Invalid input' } });

  const ticket = await Support.findById(req.params.id);
  if (!ticket) return res.status(404).json({ error: { message: 'Not found' } });

  ticket.status = parsed.data.status;
  if (parsed.data.reply) {
    ticket.reply = parsed.data.reply;
    ticket.repliedBy = req.user.id;
    ticket.repliedAt = new Date();
  }

  await ticket.save();
  return res.json({ ticket });
});

module.exports = { supportRouter: router };
