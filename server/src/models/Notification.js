const mongoose = require('mongoose');

const { Schema } = mongoose;

const NotificationSchema = new Schema(
  {
    title: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 4000 },
    level: { type: String, enum: ['info', 'maintenance', 'critical'], default: 'info' },
    active: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    target: { type: String, enum: ['all', 'admins', 'users'], default: 'all' },
  },
  { timestamps: true }
);

const Notification = mongoose.model('Notification', NotificationSchema);

module.exports = { Notification };
