import { z } from 'zod';
import { PAYMENT_STATUSES } from '../../shared/types/index.js';

export const updatePaymentStatusSchema = z.object({
  status: z.enum([PAYMENT_STATUSES.PAID, PAYMENT_STATUSES.CANCELLED]),
});

export const paymentIdParamsSchema = z.object({
  paymentId: z.string().min(1),
});