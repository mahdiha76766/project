import { FinancePayment, Order, Product, User } from '@/models';
import {
  fillDailySeries,
  lastNDaysTehran,
  MONGO_TEHRAN_DATE,
  startOfMonthTehran,
  startOfTodayTehran
} from '@/lib/admin/dashboard-dates';

export async function getAdminDashboardSummary(rangeDays = 7) {
  const today = startOfTodayTehran();
  const month = startOfMonthTehran();
  const days = lastNDaysTehran(rangeDays);
  const rangeStart = new Date(`${days[0]}T00:00:00+03:30`);

  const [
    paidToday,
    paidMonth,
    pendingPaymentOrders,
    awaitingShipment,
    lowStockCount,
    usersCount,
    ordersCount,
    recentOrders,
    salesTrendRaw,
    ordersTrendRaw,
    orderStatusBreakdown,
    paymentStatusBreakdown
  ] = await Promise.all([
    Order.aggregate([
      { $match: { paymentStatus: 'PAID', createdAt: { $gte: today } } },
      { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$totalAmount' } } }
    ]),
    Order.aggregate([
      { $match: { paymentStatus: 'PAID', createdAt: { $gte: month } } },
      { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$totalAmount' } } }
    ]),
    Order.countDocuments({ orderStatus: 'PENDING_PAYMENT' }),
    Order.countDocuments({ orderStatus: { $in: ['PAID', 'PROCESSING', 'PACKED', 'SHIPPED'] } }),
    Product.countDocuments({ stock: { $lte: 5 }, isActive: { $ne: false } }),
    User.countDocuments(),
    Order.countDocuments(),
    Order.find()
      .populate('user', 'name mobile')
      .populate('items.product', 'name images slug')
      .sort({ createdAt: -1 })
      .limit(25)
      .lean(),
    Order.aggregate([
      { $match: { paymentStatus: 'PAID', createdAt: { $gte: rangeStart } } },
      { $group: { _id: MONGO_TEHRAN_DATE, amount: { $sum: '$totalAmount' } } },
      { $sort: { _id: 1 } }
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: rangeStart } } },
      { $group: { _id: MONGO_TEHRAN_DATE, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]),
    Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Order.aggregate([
      { $group: { _id: '$paymentStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  ]);

  const salesTrend = fillDailySeries(
    days,
    salesTrendRaw.map((t: { _id: string; amount: number }) => ({ _id: t._id, amount: t.amount })),
    'amount'
  ) as Array<{ date: string; amount: number }>;

  const ordersTrend = fillDailySeries(
    days,
    ordersTrendRaw.map((t: { _id: string; count: number }) => ({ _id: t._id, count: t.count })),
    'count'
  ) as Array<{ date: string; count: number }>;

  const rangeSalesTotal = salesTrend.reduce((s, d) => s + d.amount, 0);
  const rangeOrdersTotal = ordersTrend.reduce((s, d) => s + d.count, 0);

  return {
    rangeDays,
    salesToday: paidToday[0]?.amount ?? 0,
    salesTodayCount: paidToday[0]?.count ?? 0,
    salesMonth: paidMonth[0]?.amount ?? 0,
    salesMonthCount: paidMonth[0]?.count ?? 0,
    pendingPaymentOrders,
    awaitingShipment,
    lowStockCount,
    usersCount,
    ordersCount,
    recentOrders,
    salesTrend,
    ordersTrend,
    rangeSalesTotal,
    rangeOrdersTotal,
    orderStatusBreakdown: orderStatusBreakdown.map((r: { _id: string; count: number }) => ({
      status: r._id,
      count: r.count
    })),
    paymentStatusBreakdown: paymentStatusBreakdown.map((r: { _id: string; count: number }) => ({
      status: r._id,
      count: r.count
    }))
  };
}

export async function getAdminLiveOrders() {
  const items = await Order.find()
    .populate('user', 'name mobile')
    .populate('items.product', 'name images slug')
    .sort({ createdAt: -1 })
    .limit(25)
    .lean();
  return items;
}
