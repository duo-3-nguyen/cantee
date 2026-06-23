import mongoose from 'mongoose';

const selectedModifierSnapshotSchema = new mongoose.Schema(
  {
    modifierId: { type: String, required: true },
    nameSnapshot: { type: String, required: true },
    priceAmountSnapshot: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const selectedModifierGroupSchema = new mongoose.Schema(
  {
    groupId: { type: String, required: true },
    groupNameSnapshot: { type: String, required: true },
    selectedModifiers: { type: [selectedModifierSnapshotSchema], required: true },
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    orderItemId: { type: String, required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productNameSnapshot: { type: String, required: true },
    basePriceAmountSnapshot: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, max: 99 },
    selectedModifierGroups: { type: [selectedModifierGroupSchema], required: true },
    itemSubtotalAmount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customerNameSnapshot: { type: String, required: true },
    items: { type: [orderItemSchema], required: true },
    diningMode: { type: String, enum: ['takeaway', 'eat_in'], required: true },
    pickupTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ['submitted', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'],
      required: true,
      default: 'submitted',
    },
    paymentMethod: { type: String, enum: ['cash'], required: true, default: 'cash' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'cancelled'], required: true, default: 'pending' },
    subtotalAmount: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    cancelledAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, pickupTime: 1 });

export const Order = mongoose.model('Order', orderSchema);