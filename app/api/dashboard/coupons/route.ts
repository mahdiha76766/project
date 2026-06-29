import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/db/mongoose';
import { Coupon, CouponUsage, Order } from '@/models';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectToDatabase();

  const now = new Date();
  const coupons: any[] = await Coupon.find({
    isActive: true,
    startsAt: { $lte: now },
    expiresAt: { $gte: now }
  }).sort({ expiresAt: 1 }).lean();

  const usages: any[] = await CouponUsage.find({ user: user.userId }).select('coupon').lean();
  const usedSet = new Set(usages.map((u: any) => String(u.coupon)));

  const items = await Promise.all(
    coupons.map(async (c: any) => {
      const userUsage = await CouponUsage.countDocuments({ coupon: c._id, user: user.userId });
      const userPending = await Order.countDocuments({
        coupon: c._id,
        user: user.userId,
        orderStatus: 'PENDING_PAYMENT'
      });
      const totalUsage = await CouponUsage.countDocuments({ coupon: c._id });
      const globalPending = await Order.countDocuments({ coupon: c._id, orderStatus: 'PENDING_PAYMENT' });
      const remainingGlobal = c.usageLimit > 0 ? Math.max(0, c.usageLimit - totalUsage - globalPending) : null;
      const remainingUser = Math.max(0, c.usagePerUserLimit - userUsage - userPending);

      let status = 'ACTIVE';
      if (usedSet.has(String(c._id)) && remainingUser <= 0) status = 'USED';
      else if (remainingGlobal === 0) status = 'EXHAUSTED';

      return {
        ...c,
        status,
        remainingGlobal,
        remainingUser
      };
    })
  );

  return NextResponse.json({ items: items.filter((c) => c.status === 'ACTIVE') });
}
