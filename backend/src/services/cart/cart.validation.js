import { z } from 'zod';
import { DINING_MODES } from '../../shared/types/index.js';

const selectedModifierSchema = z.object({
  modifierId: z.string().min(1),
});

const selectedModifierGroupSchema = z.object({
  groupId: z.string().min(1),
  selectedModifiers: z.array(selectedModifierSchema),
});

export const addCartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
  selectedModifierGroups: z.array(selectedModifierGroupSchema),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(99).optional(),
  selectedModifierGroups: z.array(selectedModifierGroupSchema).optional(),
});

export const checkoutDetailsSchema = z.object({
  diningMode: z.enum([DINING_MODES.TAKEAWAY, DINING_MODES.EAT_IN]),
  pickupTime: z.string().min(1),
});

export const cartItemIdParamsSchema = z.object({
  cartItemId: z.string().min(1),
});