const express = require('express');
const { z } = require('zod');

const { Notification } = require('../models/Notification');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

const createSchema = z.object({
  title: z.string().min(2).max(200),
  message: z.string().min(1).max(4000),
  level: z.enum(['info', 'maintenance', 'critical']).optional(),
  active: z.boolean().optional(),
  target: z.enum(['all', 'admins', 'users']).optional(),
});

// Create notification (admin only)
router.post('/', authRequired, requireRole('admin'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { message: 'Invalid input', details: parsed.error.flatten() } });

  const notif = await Notification.create({ ...parsed.data, createdBy: req.user.id });
  return res.status(201).json({ notification: notif });
});

// List active notifications for authenticated users
router.get('/', authRequired, async (req, res) => {
  const filter = { active: true };
  if (req.user.role !== 'admin') {
    filter.$or = [{ target: 'all' }, { target: 'users' }];
  }

  const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
  return res.json({ notifications });
});

const updateSchema = z.object({ active: z.boolean().optional(), title: z.string().optional(), message: z.string().optional(), level: z.enum(['info', 'maintenance', 'critical']).optional(), target: z.enum(['all', 'admins', 'users']).optional() });

// Update notification (admin)
router.patch('/:id', authRequired, requireRole('admin'), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { message: 'Invalid input' } });

  const notif = await Notification.findById(req.params.id);
  if (!notif) return res.status(404).json({ error: { message: 'Not found' } });

  Object.assign(notif, parsed.data);
  await notif.save();
  return res.json({ notification: notif });
});

module.exports = { notificationsRouter: router };
