import { Router } from 'express';
import { getCart, addCartItem, updateCartItem, removeCartItem, clearCart, setCheckoutDetails } from './cart.service.js';
import { addCartItemSchema, updateCartItemSchema, checkoutDetailsSchema, cartItemIdParamsSchema } from './cart.validation.js';
import { validate, validateParams } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { successResponse } from '../../shared/utils/apiHelpers.js';
import { ROLES } from '../../shared/types/index.js';

const router = Router();

// All cart routes require user role
router.use(authenticate, authorize(ROLES.USER));

// GET /api/cart
router.get('/', async (req, res, next) => {
  try {
    const cart = await getCart(req.user._id);
    res.json(successResponse({ cart }));
  } catch (err) {
    next(err);
  }
});

// POST /api/cart/items
router.post('/items', validate(addCartItemSchema), async (req, res, next) => {
  try {
    const cart = await addCartItem(req.user._id, req.body);
    res.status(201).json(successResponse({ cart }));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/cart/items/:cartItemId
router.patch('/items/:cartItemId', validateParams(cartItemIdParamsSchema), validate(updateCartItemSchema), async (req, res, next) => {
  try {
    const cart = await updateCartItem(req.user._id, req.params.cartItemId, req.body);
    res.json(successResponse({ cart }));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/cart/items/:cartItemId
router.delete('/items/:cartItemId', validateParams(cartItemIdParamsSchema), async (req, res, next) => {
  try {
    const cart = await removeCartItem(req.user._id, req.params.cartItemId);
    res.json(successResponse({ cart }));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/cart
router.delete('/', async (req, res, next) => {
  try {
    const cart = await clearCart(req.user._id);
    res.json(successResponse({ cart }));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/cart/checkout-details
router.patch('/checkout-details', validate(checkoutDetailsSchema), async (req, res, next) => {
  try {
    const cart = await setCheckoutDetails(req.user._id, req.body);
    res.json(successResponse({ cart }));
  } catch (err) {
    next(err);
  }
});

export default router;