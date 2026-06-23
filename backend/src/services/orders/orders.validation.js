import { z } from 'zod';
import { ORDER_STATUSES } from '../../shared/types/index.js';

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    ORDER_STATUSES.ACCEPTED,
    ORDER_STATUSES.PREPARING,
    ORDER_STATUSES.READY,
    ORDER_STATUSES.COMPLETED,
    ORDER_STATUSES.CANCELLED,
  ]),
});

export const orderIdParamsSchema = z.object({
  orderId: z.string().min(1),
});