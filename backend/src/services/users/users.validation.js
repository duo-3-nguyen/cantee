import { z } from 'zod';
import { ROLES, USER_STATUSES } from '../../shared/types/index.js';

export const createUserSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: z.string().min(8),
  fullName: z.string().min(1).max(120),
  role: z.enum([ROLES.USER, ROLES.STAFF, ROLES.ADMIN]),
});

export const updateUserSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()).optional(),
  fullName: z.string().min(1).max(120).optional(),
  role: z.enum([ROLES.USER, ROLES.STAFF, ROLES.ADMIN]).optional(),
  status: z.enum([USER_STATUSES.ACTIVE, USER_STATUSES.DISABLED]).optional(),
});

export const userIdParamsSchema = z.object({
  userId: z.string().min(1),
});