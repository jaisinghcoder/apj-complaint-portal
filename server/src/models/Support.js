const mongoose = require('mongoose');

const { Schema } = mongoose;

const SupportSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 4000 },
    category: { type: String, maxlength: 100, default: 'General' },
    status: { type: String, enum: ['Open', 'Pending', 'Closed'], default: 'Open' },
    reply: { type: String, maxlength: 4000, default: '' },
    repliedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    repliedAt: { type: Date },
  },
  { timestamps: true }
);

  // Ensure ticketId unique index only applies when ticketId is present (prevents multiple nulls)
  SupportSchema.index({ ticketId: 1 }, { unique: true, partialFilterExpression: { ticketId: { $exists: true, $ne: null } } });

const Support = mongoose.model('Support', SupportSchema);

module.exports = { Support };
