import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/db/mongoose';
import { Coupon, CouponUsage } from '@/models';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectToDatabase();
  const coupons:any[] = await Coupon.find().sort({ expiresAt: 1 }).lean();
  const usages:any[] = await CouponUsage.find({ user: user.userId }).select('coupon').lean();
  const usedSet = new Set(usages.map((u:any)=>String(u.coupon)));
  const now = Date.now();
  const items = coupons.map((c:any)=>({ ...c, status: usedSet.has(String(c._id)) ? 'USED' : (new Date(c.expiresAt).getTime() < now ? 'EXPIRED' : (c.isActive ? 'ACTIVE' : 'INACTIVE')) }));
  return NextResponse.json({ items });
}
