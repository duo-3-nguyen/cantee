import mongoose from 'mongoose';

const modifierSchema = new mongoose.Schema(
  {
    modifierId: { type: String, required: true },
    name: { type: String, required: true, minlength: 1, maxlength: 120 },
    priceAmount: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, required: true, default: true },
  },
  { _id: false }
);

const modifierGroupSchema = new mongoose.Schema(
  {
    groupId: { type: String, required: true },
    name: { type: String, required: true, minlength: 1, maxlength: 120 },
    modifiers: { type: [modifierSchema], required: true },
    defaultModifierIds: { type: [String], default: [] },
    minSelected: { type: Number, required: true, min: 0 },
    maxSelected: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 1, maxlength: 120 },
    description: { type: String, maxlength: 1000, default: '' },
    basePriceAmount: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, default: null },
    status: {
      type: String,
      enum: ['available', 'unavailable', 'hidden', 'deleted'],
      required: true,
      default: 'available',
    },
    modifierGroups: { type: [modifierGroupSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

productSchema.index({ status: 1, name: 1 });

export const Product = mongoose.model('Product', productSchema);