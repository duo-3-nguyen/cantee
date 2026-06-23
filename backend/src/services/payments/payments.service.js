import { Payment } from './payments.model.js';
import { Order } from '../orders/orders.model.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../shared/errors/index.js';
import { ROLES } from '../../shared/types/index.js';
import { notifyPaymentStatusChanged } from '../notifications/notifications.service.js';

export async function getPaymentForOrder(orderId, userId, userRole) {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Visibility check
  if (userRole === ROLES.USER && !order.userId.equals(userId)) {
    throw new ForbiddenError('Cannot view this payment');
  }

  const payment = await Payment.findOne({ orderId });
  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  return payment;
}

export async function updatePaymentStatus(paymentId, newStatus) {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  const previousStatus = payment.status;

  if (newStatus === 'paid') {
    payment.status = 'paid';
    payment.paidAt = new Date();

    // Also update order payment status
    await Order.updateOne({ _id: payment.orderId }, { $set: { paymentStatus: 'paid' } });
  } else if (newStatus === 'cancelled') {
    payment.status = 'cancelled';
    await Order.updateOne({ _id: payment.orderId }, { $set: { paymentStatus: 'cancelled' } });
  }

  await payment.save();

  // Dummy notification
  notifyPaymentStatusChanged(payment, previousStatus).catch(() => {});

  return payment;
}