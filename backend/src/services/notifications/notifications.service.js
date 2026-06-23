import { logger } from '../../shared/utils/logger.js';

export async function notifyOrderSubmitted(order) {
  try {
    logger.info({ orderId: order._id, orderNumber: order.orderNumber }, 'NOTIFY: Order submitted');
  } catch {
    // NOTIF-001: Must not fail primary operation
  }
}

export async function notifyOrderStatusChanged(order, previousStatus) {
  try {
    logger.info(
      { orderId: order._id, orderNumber: order.orderNumber, from: previousStatus, to: order.status },
      'NOTIFY: Order status changed'
    );
  } catch {
    // NOTIF-001
  }
}

export async function notifyPaymentStatusChanged(payment, previousStatus) {
  try {
    logger.info(
      { paymentId: payment._id, orderId: payment.orderId, from: previousStatus, to: payment.status },
      'NOTIFY: Payment status changed'
    );
  } catch {
    // NOTIF-001
  }
}