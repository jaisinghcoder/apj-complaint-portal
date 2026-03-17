const mongoose = require("mongoose");

const historySchema = new mongoose.Schema(
  {
    from: { type: String, default: null },
    to: { type: String, required: true },
    note: { type: String, default: "" },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const complaintSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },// ... existing fields
    attachment: {
    type: String, // Yahan file ka path ya URL save hoga
    default: null
    },
// ...

    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"],
      default: "Pending",
      required: true,
      index: true,
    },
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true },
);

const Complaint = mongoose.model("Complaint", complaintSchema);

module.exports = { Complaint };
