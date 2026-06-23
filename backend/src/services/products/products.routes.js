import { Router } from 'express';
import { listProducts, getProduct, createProduct, updateProduct, updateProductStatus } from './products.service.js';
import { createProductSchema, updateProductSchema, updateProductStatusSchema, productIdParamsSchema } from './products.validation.js';
import { validate, validateQuery, validateParams } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { successResponse, paginatedResponse, paginationSchema } from '../../shared/utils/apiHelpers.js';
import { ROLES } from '../../shared/types/index.js';

const router = Router();

// GET /api/products
router.get('/', authenticate, authorize(ROLES.USER, ROLES.STAFF, ROLES.ADMIN), validateQuery(paginationSchema), async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const { products, totalItems } = await listProducts({ page, limit, role: req.user.role });
    res.json(paginatedResponse(products, totalItems, page, limit));
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:productId
router.get('/:productId', authenticate, authorize(ROLES.USER, ROLES.STAFF, ROLES.ADMIN), validateParams(productIdParamsSchema), async (req, res, next) => {
  try {
    const product = await getProduct(req.params.productId, req.user.role);
    res.json(successResponse({ product }));
  } catch (err) {
    next(err);
  }
});

// POST /api/products
router.post('/', authenticate, authorize(ROLES.STAFF, ROLES.ADMIN), validate(createProductSchema), async (req, res, next) => {
  try {
    const product = await createProduct(req.body, req.user._id);
    res.status(201).json(successResponse({ product }));
  } catch (err) {
    next(err);
  }
});

// PUT /api/products/:productId
router.put('/:productId', authenticate, authorize(ROLES.STAFF, ROLES.ADMIN), validateParams(productIdParamsSchema), validate(updateProductSchema), async (req, res, next) => {
  try {
    const product = await updateProduct(req.params.productId, req.body, req.user._id);
    res.json(successResponse({ product }));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/products/:productId/status
router.patch('/:productId/status', authenticate, authorize(ROLES.STAFF, ROLES.ADMIN), validateParams(productIdParamsSchema), validate(updateProductStatusSchema), async (req, res, next) => {
  try {
    const product = await updateProductStatus(req.params.productId, req.body.status, req.user._id);
    res.json(successResponse({ product }));
  } catch (err) {
    next(err);
  }
});

export default router;