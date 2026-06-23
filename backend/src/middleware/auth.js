import { createHash } from 'node:crypto';
import { UnauthorizedError, ForbiddenError } from '../shared/errors/index.js';
import { ROLES } from '../shared/types/index.js';
import { Session } from '../services/auth/auth.model.js';
import { User } from '../services/users/users.model.js';
import config from '../config/index.js';

function hashSessionId(rawSessionId) {
  return createHash('sha256').update(rawSessionId).digest('hex');
}

export async function authenticate(req, _res, next) {
  try {
    const rawSessionId = req.cookies?.[config.session.cookieName];
    if (!rawSessionId) {
      throw new UnauthorizedError('No session cookie');
    }

    const sessionIdHash = hashSessionId(rawSessionId);
    const session = await Session.findOne({ sessionIdHash });

    if (!session) {
      throw new UnauthorizedError('Session not found');
    }

    if (session.revokedAt) {
      throw new UnauthorizedError('Session revoked');
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedError('Session expired');
    }

    // Update lastSeenAt
    session.lastSeenAt = new Date();
    await session.save();

    // Load user to get current role (in case admin changed it)
    const user = await User.findById(session.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (user.status !== 'active') {
      throw new ForbiddenError('Account is disabled');
    }

    req.user = user;
    req.session = session;
    next();
  } catch (err) {
    next(err);
  }
}

export function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Not authenticated'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };
}

export function optionalAuth(req, _res, next) {
  // Like authenticate but doesn't fail if no session
  const rawSessionId = req.cookies?.[config.session.cookieName];
  if (!rawSessionId) {
    return next();
  }
  authenticate(req, _res, next);
}