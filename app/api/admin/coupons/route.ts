import { NextResponse } from 'next/server';
import { Coupon } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
import { getPaginationParams, paginatedResponse } from '@/lib/admin/pagination';
import { normalizeCouponBody } from '@/lib/admin/coupon-body';

async function guard() {
  const u = await getSessionUser();
  return u && hasMinimumRole(u.role, 'ADMIN');
}

export async function GET(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { page, limit, skip } = getPaginationParams(req.url);
  await connectToDatabase();
  const [items, total] = await Promise.all([
    Coupon.find().populate('allowedCategories', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Coupon.countDocuments()
  ]);
  return NextResponse.json(paginatedResponse(items, total, page, limit));
}

export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const b = await req.json();
    if (!b.code?.trim()) return NextResponse.json({ error: 'کد تخفیف الزامی است.' }, { status: 400 });
    if (!b.startsAt || !b.expiresAt) return NextResponse.json({ error: 'تاریخ شروع و انقضا الزامی است.' }, { status: 400 });
    await connectToDatabase();
    const item = await Coupon.create(normalizeCouponBody(b));
    return NextResponse.json({ item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'خطا در ایجاد کد تخفیف' }, { status: 400 });
  }
}
