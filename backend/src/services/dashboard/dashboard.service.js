import { Order } from '../orders/orders.model.js';
import { Payment } from '../payments/payments.model.js';
import { User } from '../users/users.model.js';
import { CanteenSettings } from '../settings/settings.model.js';
import { ROLES } from '../../shared/types/index.js';

export async function getDashboardSummary({ from, to }) {
  const settings = await CanteenSettings.findOne();
  const timezone = settings?.timezone || 'UTC';

  // Build date range
  const fromDate = from ? new Date(from) : getLocalDayStart(timezone);
  const toDate = to ? new Date(to) : getLocalDayEnd(timezone);

  // Total orders in range
  const totalOrders = await Order.countDocuments({
    createdAt: { $gte: fromDate, $lte: toDate },
  });

  // Orders by status
  const ordersByStatusAgg = await Order.aggregate([
    { $match: { createdAt: { $gte: fromDate, $lte: toDate } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const ordersByStatus = {};
  for (const item of ordersByStatusAgg) {
    ordersByStatus[item._id] = item.count;
  }

  // Cash revenue (paid payments in range)
  const cashRevenueAgg = await Payment.aggregate([
    {
      $match: {
        status: 'paid',
        updatedAt: { $gte: fromDate, $lte: toDate },
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const cashRevenueAmount = cashRevenueAgg.length > 0 ? cashRevenueAgg[0].total : 0;

  // Top products from order item snapshots
  const topProductsAgg = await Order.aggregate([
    { $match: { createdAt: { $gte: fromDate, $lte: toDate } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productNameSnapshot',
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.itemSubtotalAmount' },
      },
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 10 },
  ]);
  const topProducts = topProductsAgg.map((p) => ({
    productName: p._id,
    totalQuantity: p.totalQuantity,
    totalRevenue: p.totalRevenue,
  }));

  // Active users
  const activeUsers = await User.countDocuments({ role: ROLES.USER, status: 'active' });
  const activeStaff = await User.countDocuments({
    role: { $in: [ROLES.STAFF, ROLES.ADMIN] },
    status: 'active',
  });

  return {
    totalOrders,
    ordersByStatus,
    cashRevenueAmount,
    topProducts,
    activeUsers,
    activeStaff,
  };
}

function getLocalDayStart(timezone) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [year, month, day] = formatter.format(now).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

function getLocalDayEnd(timezone) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [year, month, day] = formatter.format(now).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
}