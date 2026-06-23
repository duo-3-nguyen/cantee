import argon2 from 'argon2';
import { User } from './users.model.js';
import { ConflictError, NotFoundError, BadRequestError } from '../../shared/errors/index.js';
import { ROLES } from '../../shared/types/index.js';
import { sanitizeUser } from '../auth/auth.service.js';

export async function getProfile(user) {
  return sanitizeUser(user);
}

export async function listUsers({ page, limit, role, status }) {
  const filter = {};
  if (role) filter.role = role;
  if (status) filter.status = status;

  const totalItems = await User.countDocuments(filter);
  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    users: users.map(sanitizeUser),
    totalItems,
  };
}

export async function createUser({ email, password, fullName, role }) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ConflictError('Email already registered');
  }

  const passwordHash = await argon2.hash(password);

  const user = await User.create({
    email,
    passwordHash,
    fullName,
    role,
    status: 'active',
  });

  return sanitizeUser(user);
}

export async function updateUser(adminUser, userId, updates) {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // ADMIN-004: Admin cannot disable own account
  if (adminUser._id.equals(user._id) && updates.status === 'disabled') {
    throw new BadRequestError('Cannot disable your own account');
  }

  // ADMIN-005: Admin cannot demote own role
  if (adminUser._id.equals(user._id) && updates.role && updates.role !== ROLES.ADMIN) {
    throw new BadRequestError('Cannot demote your own role');
  }

  if (updates.email && updates.email !== user.email) {
    const existing = await User.findOne({ email: updates.email });
    if (existing) {
      throw new ConflictError('Email already in use');
    }
  }

  Object.assign(user, updates);
  await user.save();

  return sanitizeUser(user);
}

export async function disableUser(adminUser, userId) {
  return updateUser(adminUser, userId, { status: 'disabled' });
}

export async function enableUser(adminUser, userId) {
  return updateUser(adminUser, userId, { status: 'active' });
}