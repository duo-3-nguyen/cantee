import { Router } from 'express';
import { getDashboardSummary } from './dashboard.service.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { successResponse } from '../../shared/utils/apiHelpers.js';
import { ROLES } from '../../shared/types/index.js';

const router = Router();

// GET /api/dashboard/summary
router.get('/summary', authenticate, authorize(ROLES.ADMIN), async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const summary = await getDashboardSummary({ from, to });
    res.json(successResponse(summary));
  } catch (err) {
    next(err);
  }
});

export default router;