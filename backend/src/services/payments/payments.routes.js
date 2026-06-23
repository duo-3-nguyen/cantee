import { Router } from 'express';
import { getPaymentForOrder, updatePaymentStatus } from './payments.service.js';
import { updatePaymentStatusSchema, paymentIdParamsSchema } from './payments.validation.js';
import { validate, validateParams } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { successResponse } from '../../shared/utils/apiHelpers.js';
import { ROLES } from '../../shared/types/index.js';
import { orderIdParamsSchema } from '../orders/orders.validation.js';

const router = Router();

// GET /api/orders/:orderId/payment
router.get('/orders/:orderId/payment', authenticate, authorize(ROLES.USER, ROLES.STAFF, ROLES.ADMIN), validateParams(orderIdParamsSchema), async (req, res, next) => {
  try {
    const payment = await getPaymentForOrder(req.params.orderId, req.user._id, req.user.role);
    res.json(successResponse({ payment }));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/payments/:paymentId/status
router.patch('/payments/:paymentId/status', authenticate, authorize(ROLES.STAFF, ROLES.ADMIN), validateParams(paymentIdParamsSchema), validate(updatePaymentStatusSchema), async (req, res, next) => {
  try {
    const payment = await updatePaymentStatus(req.params.paymentId, req.body.status);
    res.json(successResponse({ payment }));
  } catch (err) {
    next(err);
  }
});

export default router;