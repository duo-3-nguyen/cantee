import mongoose from 'mongoose';

const openingHoursItemSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    isOpen: { type: Boolean, required: true },
    openTime: { type: String, default: null },
    closeTime: { type: String, default: null },
  },
  { _id: false }
);

const canteenSettingsSchema = new mongoose.Schema(
  {
    canteenName: { type: String, required: true, minlength: 1, maxlength: 120 },
    address: { type: String, required: true, minlength: 1, maxlength: 300 },
    timezone: { type: String, required: true },
    openingHours: { type: [openingHoursItemSchema], required: true },
  },
  { timestamps: true }
);

export const CanteenSettings = mongoose.model('CanteenSettings', canteenSettingsSchema);