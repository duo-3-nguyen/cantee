export const ROLES = {
  USER: 'user',
  STAFF: 'staff',
  ADMIN: 'admin',
};

export const USER_STATUSES = {
  ACTIVE: 'active',
  DISABLED: 'disabled',
};

export const PRODUCT_STATUSES = {
  AVAILABLE: 'available',
  UNAVAILABLE: 'unavailable',
  HIDDEN: 'hidden',
  DELETED: 'deleted',
};

export const ORDER_STATUSES = {
  SUBMITTED: 'submitted',
  ACCEPTED: 'accepted',
  PREPARING: 'preparing',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  CANCELLED: 'cancelled',
};

export const PAYMENT_METHODS = {
  CASH: 'cash',
};

export const DINING_MODES = {
  TAKEAWAY: 'takeaway',
  EAT_IN: 'eat_in',
};

export const ORDER_STATUS_TRANSITIONS = {
  [ORDER_STATUSES.SUBMITTED]: [ORDER_STATUSES.ACCEPTED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.ACCEPTED]: [ORDER_STATUSES.PREPARING, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.PREPARING]: [ORDER_STATUSES.READY, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.READY]: [ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.COMPLETED]: [],
  [ORDER_STATUSES.CANCELLED]: [],
};

export const ROLE_DEFAULT_ROUTES = {
  [ROLES.USER]: '/user',
  [ROLES.STAFF]: '/staff',
  [ROLES.ADMIN]: '/admin',
};