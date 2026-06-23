import { randomUUID, createHash } from 'node:crypto';
import argon2 from 'argon2';
import { Session } from './auth.model.js';
import { User } from '../users/users.model.js';
import { ConflictError, UnauthorizedError, ForbiddenError } from '../../shared/errors/index.js';
import { ROLES, ROLE_DEFAULT_ROUTES } from '../../shared/types/index.js';
import config from '../../config/index.js';

function hashSessionId(rawSessionId) {
  return createHash('sha256').update(rawSessionId).digest('hex');
}

function generateSessionId() {
  return randomUUID();
}

export async function registerUser({ email, password, fullName }) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ConflictError('Email already registered');
  }

  const passwordHash = await argon2.hash(password);

  const user = await User.create({
    email,
    passwordHash,
    fullName,
    role: ROLES.USER,
    status: 'active',
  });

  return sanitizeUser(user);
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) {
    throw new UnauthorizedError('Unregistered email');
  }

  if (user.status === 'disabled') {
    throw new ForbiddenError('Account is disabled');
  }

  const valid = await argon2.verify(user.passwordHash, password);
  if (!valid) {
    throw new UnauthorizedError('Wrong password');
  }

  const rawSessionId = generateSessionId();
  const sessionIdHash = hashSessionId(rawSessionId);
  const ttlDays = config.session.ttlDays;
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  await Session.create({
    sessionIdHash,
    userId: user._id,
    roleAtLogin: user.role,
    expiresAt,
    lastSeenAt: new Date(),
  });

  return {
    rawSessionId,
    user: sanitizeUser(user),
    defaultRoute: ROLE_DEFAULT_ROUTES[user.role],
  };
}

export async function logoutUser(session) {
  session.revokedAt = new Date();
  await session.save();
}

export async function getCurrentSession(user) {
  return { user: sanitizeUser(user) };
}

export function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt?.toISOString(),
    updatedAt: user.updatedAt?.toISOString(),
  };
}