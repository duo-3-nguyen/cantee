import { z } from 'zod';
import { PRODUCT_STATUSES } from '../../shared/types/index.js';

const modifierSchema = z.object({
  modifierId: z.string().min(1),
  name: z.string().min(1).max(120),
  priceAmount: z.number().int().min(0),
  isActive: z.boolean(),
});

const modifierGroupSchema = z.object({
  groupId: z.string().min(1),
  name: z.string().min(1).max(120),
  modifiers: z.array(modifierSchema).min(1),
  defaultModifierIds: z.array(z.string()).default([]),
  minSelected: z.number().int().min(0),
  maxSelected: z.number().int().min(0),
});

export const createProductSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional().default(''),
  basePriceAmount: z.number().int().min(0),
  imageUrl: z.string().nullable().optional().default(null),
  status: z.enum([PRODUCT_STATUSES.AVAILABLE, PRODUCT_STATUSES.UNAVAILABLE, PRODUCT_STATUSES.HIDDEN]),
  modifierGroups: z.array(modifierGroupSchema).default([]),
});

export const updateProductSchema = createProductSchema;

export const updateProductStatusSchema = z.object({
  status: z.enum([PRODUCT_STATUSES.AVAILABLE, PRODUCT_STATUSES.UNAVAILABLE, PRODUCT_STATUSES.HIDDEN]),
});

export const productIdParamsSchema = z.object({
  productId: z.string().min(1),
});