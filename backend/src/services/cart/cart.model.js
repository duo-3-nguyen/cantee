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

const cartItemSchema = new mongoose.Schema(
  {
    cartItemId: { type: String, required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productNameSnapshot: { type: String, required: true },
    basePriceAmountSnapshot: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, max: 99 },
    selectedModifierGroups: { type: [selectedModifierGroupSchema], required: true },
    itemSubtotalAmount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
    diningMode: { type: String, enum: ['takeaway', 'eat_in', null], default: null },
    pickupTime: { type: Date, default: null },
    subtotalAmount: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export const Cart = mongoose.model('Cart', cartSchema);