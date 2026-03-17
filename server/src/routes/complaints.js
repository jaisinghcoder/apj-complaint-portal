const express = require('express');
const { z } = require('zod');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { Complaint } = require('../models/Complaint');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error('Only images (JPG, PNG, GIF) and PDFs are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const createComplaintSchema = z.object({
  category: z.string().min(2).max(50),
  title: z.string().min(2).max(120),
  description: z.string().min(5).max(2000),
});

router.post('/', authRequired, upload.single('attachment'), async (req, res) => {
  const parsed = createComplaintSchema.safeParse(req.body);
  if (!parsed.success) {
    // Clean up uploaded file if validation fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ error: { message: 'Invalid input', details: parsed.error.flatten() } });
  }

  const { category, title, description } = parsed.data;
  const userId = new mongoose.Types.ObjectId(req.user.id);

  const complaint = await Complaint.create({
    user: userId,
    category,
    title,
    description,
    attachment: req.file ? `/uploads/${req.file.filename}` : null,
    status: 'Pending',
    history: [
      {
        from: null,
        to: 'Pending',
        note: 'Created',
        changedBy: userId,
      },
    ],
  });

  return res.status(201).json({ complaint });
});

router.get('/', authRequired, async (req, res) => {
  const { status, category, userId } = req.query;

  const filter = {};

  if (req.user.role !== 'admin') {
    filter.user = req.user.id;
  } else if (userId) {
    filter.user = userId;
  }

  if (status && ['Pending', 'In Progress', 'Resolved'].includes(String(status))) {
    filter.status = String(status);
  }
  if (category) {
    filter.category = String(category);
  }

  let query = Complaint.find(filter).sort({ createdAt: -1 }).limit(200);
  if (req.user.role === 'admin') {
    query = query.populate('user', 'name email');
  }

  const complaints = await query;

  return res.json({ complaints });
});

router.get('/:id', authRequired, async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('user', 'name email role');

  if (!complaint) {
    return res.status(404).json({ error: { message: 'Not found' } });
  }

  if (req.user.role !== 'admin' && complaint.user._id.toString() !== req.user.id) {
    return res.status(403).json({ error: { message: 'Forbidden' } });
  }

  return res.json({ complaint });
});

const updateStatusSchema = z.object({
  status: z.enum(['Pending', 'In Progress', 'Resolved']),
  note: z.string().max(500).optional(),
});

router.patch('/:id/status', authRequired, requireRole('admin'), async (req, res) => {
  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { message: 'Invalid input' } });
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: { message: 'Not found' } });
  }

  const { status, note } = parsed.data;
  const from = complaint.status;
  complaint.status = status;
  complaint.history.push({
    from,
    to: status,
    note: note || '',
    changedBy: req.user.id,
  });

  await complaint.save();
  return res.json({ complaint });
});

module.exports = { complaintsRouter: router };
