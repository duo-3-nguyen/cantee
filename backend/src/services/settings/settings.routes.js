import { Router } from 'express';
import { getSettings, updateSettings } from './settings.service.js';
import { updateSettingsSchema } from './settings.validation.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { successResponse } from '../../shared/utils/apiHelpers.js';
import { ROLES } from '../../shared/types/index.js';

const router = Router();

// GET /api/settings/canteen
router.get('/canteen', authenticate, authorize(ROLES.USER, ROLES.STAFF, ROLES.ADMIN), async (req, res, next) => {
  try {
    const settings = await getSettings();
    res.json(successResponse({ settings }));
  } catch (err) {
    next(err);
  }
});

// PUT /api/settings/canteen
router.put('/canteen', authenticate, authorize(ROLES.ADMIN), validate(updateSettingsSchema), async (req, res, next) => {
  try {
    const settings = await updateSettings(req.body);
    res.json(successResponse({ settings }));
  } catch (err) {
    next(err);
  }
});

export default router;