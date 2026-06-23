import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, minlength: 1, maxlength: 120 },
    role: { type: String, enum: ['user', 'staff', 'admin'], required: true },
    status: { type: String, enum: ['active', 'disabled'], required: true, default: 'active' },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, status: 1 });

userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);