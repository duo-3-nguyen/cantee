import { Router } from 'express';
import { getProfile, listUsers, createUser, updateUser, disableUser, enableUser } from './users.service.js';
import { createUserSchema, updateUserSchema, userIdParamsSchema } from './users.validation.js';
import { validate, validateQuery, validateParams } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { successResponse, paginatedResponse, paginationSchema } from '../../shared/utils/apiHelpers.js';
import { ROLES } from '../../shared/types/index.js';
import { z } from 'zod';

const router = Router();

// GET /api/users/me
router.get('/me', authenticate, authorize(ROLES.USER, ROLES.STAFF, ROLES.ADMIN), async (req, res, next) => {
  try {
    const user = await getProfile(req.user);
    res.json(successResponse({ user }));
  } catch (err) {
    next(err);
  }
});

// GET /api/users
router.get('/', authenticate, authorize(ROLES.ADMIN), validateQuery(paginationSchema), async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const { users, totalItems } = await listUsers({ page, limit, ...req.query });
    res.json(paginatedResponse(users, totalItems, page, limit));
  } catch (err) {
    next(err);
  }
});

// POST /api/users
router.post('/', authenticate, authorize(ROLES.ADMIN), validate(createUserSchema), async (req, res, next) => {
  try {
    const user = await createUser(req.body);
    res.status(201).json(successResponse({ user }));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:userId
router.patch('/:userId', authenticate, authorize(ROLES.ADMIN), validateParams(userIdParamsSchema), validate(updateUserSchema), async (req, res, next) => {
  try {
    const user = await updateUser(req.user, req.params.userId, req.body);
    res.json(successResponse({ user }));
  } catch (err) {
    next(err);
  }
});

// POST /api/users/:userId/disable
router.post('/:userId/disable', authenticate, authorize(ROLES.ADMIN), validateParams(userIdParamsSchema), async (req, res, next) => {
  try {
    const user = await disableUser(req.user, req.params.userId);
    res.json(successResponse({ user }));
  } catch (err) {
    next(err);
  }
});

// POST /api/users/:userId/enable
router.post('/:userId/enable', authenticate, authorize(ROLES.ADMIN), validateParams(userIdParamsSchema), async (req, res, next) => {
  try {
    const user = await enableUser(req.user, req.params.userId);
    res.json(successResponse({ user }));
  } catch (err) {
    next(err);
  }
});

export default router;