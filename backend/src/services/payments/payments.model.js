import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    method: { type: String, enum: ['cash'], required: true },
    status: { type: String, enum: ['pending', 'paid', 'cancelled'], required: true, default: 'pending' },
    amount: { type: Number, required: true, min: 0 },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

paymentSchema.index({ status: 1, updatedAt: -1 });

export const Payment = mongoose.model('Payment', paymentSchema);