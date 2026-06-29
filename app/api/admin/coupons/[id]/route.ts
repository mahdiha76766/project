import { NextResponse } from 'next/server';
import { Coupon } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
import { normalizeCouponBody } from '@/lib/admin/coupon-body';

async function guard() {
  const u = await getSessionUser();
  return u && hasMinimumRole(u.role, 'ADMIN');
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { id } = await params;
    const b = await req.json();
    await connectToDatabase();
    const item = await Coupon.findByIdAndUpdate(id, normalizeCouponBody(b), { new: true, runValidators: true });
    if (!item) return NextResponse.json({ error: 'کد تخفیف یافت نشد.' }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'خطا در ویرایش کد تخفیف' }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  await connectToDatabase();
  await Coupon.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
