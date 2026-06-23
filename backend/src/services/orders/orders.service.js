import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { Order } from './orders.model.js';
import { Cart } from '../cart/cart.model.js';
import { Product } from '../products/products.model.js';
import { Payment } from '../payments/payments.model.js';
import { CanteenSettings } from '../settings/settings.model.js';
import { NotFoundError, BadRequestError } from '../../shared/errors/index.js';
import { ORDER_STATUS_TRANSITIONS, PRODUCT_STATUSES, PAYMENT_STATUSES, ROLES } from '../../shared/types/index.js';
import { notifyOrderSubmitted, notifyOrderStatusChanged } from '../notifications/notifications.service.js';

function generateOrderNumber() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${dateStr}-${rand}`;
}

export async function createOrder(userId) {
  const cart = await Cart.findOne({ userId });
  if (!cart || cart.items.length === 0) {
    throw new BadRequestError('Cart is empty');
  }

  if (!cart.diningMode || !cart.pickupTime) {
    throw new BadRequestError('Vui lòng chọn mang đi hay tại chỗ');
  }

  // Validate pickup time
  await validatePickupTime(cart.pickupTime);

  // Revalidate all products and modifiers
  const orderItems = [];
  for (const cartItem of cart.items) {
    const product = await Product.findById(cartItem.productId);
    if (!product || product.status !== PRODUCT_STATUSES.AVAILABLE) {
      throw new BadRequestError(`Product "${cartItem.productNameSnapshot}" is no longer available`);
    }

    // Rebuild snapshots from current product data
    const modifierGroupSnapshots = product.modifierGroups.map((pg) => {
      const cartGroup = cartItem.selectedModifierGroups.find((cg) => cg.groupId === pg.groupId);
      const selectedModifierIds = cartGroup
        ? cartGroup.selectedModifiers.map((m) => m.modifierId)
        : pg.defaultModifierIds;

      const selectedModifiers = selectedModifierIds.map((modId) => {
        const mod = pg.modifiers.find((m) => m.modifierId === modId);
        if (!mod || !mod.isActive) {
          throw new BadRequestError(`Modifier in group "${pg.name}" is no longer available`);
        }
        return {
          modifierId: mod.modifierId,
          nameSnapshot: mod.name,
          priceAmountSnapshot: mod.priceAmount,
        };
      });

      return {
        groupId: pg.groupId,
        groupNameSnapshot: pg.name,
        selectedModifiers,
      };
    });

    const modifierTotal = modifierGroupSnapshots.reduce(
      (sum, mg) => sum + mg.selectedModifiers.reduce((s, m) => s + m.priceAmountSnapshot, 0),
      0
    );
    const itemSubtotalAmount = cartItem.quantity * (product.basePriceAmount + modifierTotal);

    orderItems.push({
      orderItemId: randomUUID(),
      productId: product._id,
      productNameSnapshot: product.name,
      basePriceAmountSnapshot: product.basePriceAmount,
      quantity: cartItem.quantity,
      selectedModifierGroups: modifierGroupSnapshots,
      itemSubtotalAmount,
    });
  }

  const subtotalAmount = orderItems.reduce((sum, item) => sum + item.itemSubtotalAmount, 0);

  // Use a transaction for order creation, payment creation, and cart clearing
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.create(
      [
        {
          orderNumber: generateOrderNumber(),
          userId,
          customerNameSnapshot: cart.userId, // Will be populated from user
          items: orderItems,
          diningMode: cart.diningMode,
          pickupTime: cart.pickupTime,
          status: 'submitted',
          paymentMethod: 'cash',
          paymentStatus: 'pending',
          subtotalAmount,
          totalAmount: subtotalAmount,
        },
      ],
      { session }
    );

    // Populate customer name
    const { User } = await import('../users/users.model.js');
    const user = await User.findById(userId);
    order[0].customerNameSnapshot = user.fullName;
    await order[0].save({ session });

    // Create payment
    await Payment.create(
      [
        {
          orderId: order[0]._id,
          method: 'cash',
          status: 'pending',
          amount: subtotalAmount,
        },
      ],
      { session }
    );

    // Clear cart
    await Cart.updateOne(
      { userId },
      { $set: { items: [], subtotalAmount: 0, diningMode: null, pickupTime: null } },
      { session }
    );

    await session.commitTransaction();

    // Dummy notification (outside transaction)
    notifyOrderSubmitted(order[0]).catch(() => {});

    return order[0];
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function listMyOrders(userId, { page, limit }) {
  const filter = { userId };
  const totalItems = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return { orders, totalItems };
}

export async function getMyOrder(userId, orderId) {
  const order = await Order.findOne({ _id: orderId, userId });
  if (!order) {
    throw new NotFoundError('Order not found');
  }
  return order;
}

export async function listAllOrders({ page, limit, status }) {
  const filter = {};
  if (status) filter.status = status;

  const totalItems = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .sort({ pickupTime: 1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return { orders, totalItems };
}

export async function getAnyOrder(orderId) {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new NotFoundError('Order not found');
  }
  return order;
}

export async function updateOrderStatus(orderId, newStatus) {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new NotFoundError('Order not found');
  }

  const allowedTransitions = ORDER_STATUS_TRANSITIONS[order.status];
  if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
    throw new BadRequestError(
      `Cannot transition order from "${order.status}" to "${newStatus}"`
    );
  }

  const previousStatus = order.status;
  order.status = newStatus;

  if (newStatus === 'completed') {
    order.completedAt = new Date();
  }

  if (newStatus === 'cancelled') {
    order.cancelledAt = new Date();
    // Update payment if not already paid
    if (order.paymentStatus !== 'paid') {
      order.paymentStatus = 'cancelled';
      await Payment.updateOne(
        { orderId: order._id, status: { $ne: 'paid' } },
        { $set: { status: 'cancelled' } }
      );
    }
  }

  await order.save();

  // Dummy notification
  notifyOrderStatusChanged(order, previousStatus).catch(() => {});

  return order;
}

async function validatePickupTime(pickupDate) {
  const settings = await CanteenSettings.findOne();
  if (!settings) {
    throw new BadRequestError('Canteen settings not configured');
  }

  if (pickupDate <= new Date()) {
    throw new BadRequestError('Vui lòng chọn thời gian trong tương lai');
  }

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: settings.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(pickupDate);
  const getPart = (type) => parts.find((p) => p.type === type)?.value;

  const dayOfWeekMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const localDayOfWeek = dayOfWeekMap[getPart('weekday')];
  const localHour = parseInt(getPart('hour'), 10);
  const localMinute = parseInt(getPart('minute'), 10);
  const localTimeMinutes = localHour * 60 + localMinute;

  const daySchedule = settings.openingHours.find((d) => d.dayOfWeek === localDayOfWeek);
  if (!daySchedule || !daySchedule.isOpen) {
    throw new BadRequestError('Canteen is closed on this day');
  }

  const [openH, openM] = daySchedule.openTime.split(':').map(Number);
  const [closeH, closeM] = daySchedule.closeTime.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (localTimeMinutes < openMinutes) {
    throw new BadRequestError(`Pickup time is before opening time (${daySchedule.openTime})`);
  }

  if (localTimeMinutes > closeMinutes) {
    throw new BadRequestError(`Pickup time is after closing time (${daySchedule.closeTime})`);
  }
}