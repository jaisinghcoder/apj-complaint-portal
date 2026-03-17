const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      required: true,
    },
  },
  { timestamps: true },
);

userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject({ virtuals: true });
  delete obj.passwordHash;
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = { User };
