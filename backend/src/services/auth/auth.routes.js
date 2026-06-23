import { Router } from 'express';
import { registerUser, loginUser, logoutUser, getCurrentSession } from './auth.service.js';
import { registerSchema, loginSchema } from './auth.validation.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { successResponse } from '../../shared/utils/apiHelpers.js';
import { ROLES } from '../../shared/types/index.js';
import config from '../../config/index.js';

const router = Router();

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const user = await registerUser(req.body);
    res.status(201).json(successResponse({ user }));
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { rawSessionId, user, defaultRoute } = await loginUser(req.body);
    const ttlDays = config.session.ttlDays;
    res.cookie(config.session.cookieName, rawSessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.nodeEnv === 'production',
      maxAge: ttlDays * 24 * 60 * 60 * 1000,
      path: '/',
    });
    res.json(successResponse({ user, defaultRoute }));
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, authorize(ROLES.USER, ROLES.STAFF, ROLES.ADMIN), async (req, res, next) => {
  try {
    await logoutUser(req.session);
    res.clearCookie(config.session.cookieName, { path: '/' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/session
router.get('/session', authenticate, authorize(ROLES.USER, ROLES.STAFF, ROLES.ADMIN), async (req, res, next) => {
  try {
    const result = await getCurrentSession(req.user);
    res.json(successResponse(result));
  } catch (err) {
    next(err);
  }
});

export default router;