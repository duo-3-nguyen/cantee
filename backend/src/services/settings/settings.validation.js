import { z } from 'zod';

const openingHoursItemSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  isOpen: z.boolean(),
  openTime: z.string().nullable().optional(),
  closeTime: z.string().nullable().optional(),
});

export const updateSettingsSchema = z.object({
  canteenName: z.string().min(1).max(120),
  address: z.string().min(1).max(300),
  timezone: z.string().min(1),
  openingHours: z.array(openingHoursItemSchema),
});