import { Router } from 'express';
import { createOrder, listMyOrders, getMyOrder, listAllOrders, getAnyOrder, updateOrderStatus } from './orders.service.js';
import { updateOrderStatusSchema, orderIdParamsSchema } from './orders.validation.js';
import { validate, validateQuery, validateParams } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { successResponse, paginatedResponse, paginationSchema } from '../../shared/utils/apiHelpers.js';
import { ROLES } from '../../shared/types/index.js';

const router = Router();

// POST /api/orders - Create order from cart (user only)
router.post('/', authenticate, authorize(ROLES.USER), async (req, res, next) => {
  try {
    const order = await createOrder(req.user._id);
    res.status(201).json(successResponse({ order }));
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/my - List own orders
router.get('/my', authenticate, authorize(ROLES.USER), validateQuery(paginationSchema), async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const { orders, totalItems } = await listMyOrders(req.user._id, { page, limit });
    res.json(paginatedResponse(orders, totalItems, page, limit));
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/my/:orderId - Get own order detail
router.get('/my/:orderId', authenticate, authorize(ROLES.USER), validateParams(orderIdParamsSchema), async (req, res, next) => {
  try {
    const order = await getMyOrder(req.user._id, req.params.orderId);
    res.json(successResponse({ order }));
  } catch (err) {
    next(err);
  }
});

// GET /api/orders - List all orders (staff/admin)
router.get('/', authenticate, authorize(ROLES.STAFF, ROLES.ADMIN), validateQuery(paginationSchema), async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const { orders, totalItems } = await listAllOrders({ page, limit, status });
    res.json(paginatedResponse(orders, totalItems, page, limit));
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:orderId - Get any order detail (staff/admin)
router.get('/:orderId', authenticate, authorize(ROLES.STAFF, ROLES.ADMIN), validateParams(orderIdParamsSchema), async (req, res, next) => {
  try {
    const order = await getAnyOrder(req.params.orderId);
    res.json(successResponse({ order }));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/orders/:orderId/status - Update order status (staff/admin)
router.patch('/:orderId/status', authenticate, authorize(ROLES.STAFF, ROLES.ADMIN), validateParams(orderIdParamsSchema), validate(updateOrderStatusSchema), async (req, res, next) => {
  try {
    const order = await updateOrderStatus(req.params.orderId, req.body.status);
    res.json(successResponse({ order }));
  } catch (err) {
    next(err);
  }
});

export default router;