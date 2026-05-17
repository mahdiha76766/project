import { NextResponse } from 'next/server';
import { Coupon } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';

async function guard() { const u = await getSessionUser(); return u && hasMinimumRole(u.role, 'ADMIN'); }

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await connectToDatabase();
  const items = await Coupon.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const b = await req.json();
  await connectToDatabase();
  const item = await Coupon.create({
    code: String(b.code || '').trim().toUpperCase(),
    discountType: b.discountType,
    value: Number(b.value || 0),
    minPurchaseAmount: Number(b.minPurchaseAmount || 0),
    maxDiscountAmount: b.maxDiscountAmount ? Number(b.maxDiscountAmount) : undefined,
    startsAt: b.startsAt,
    expiresAt: b.expiresAt,
    usageLimit: Number(b.usageLimit || 0),
    usagePerUserLimit: Number(b.usagePerUserLimit || 1),
    isActive: b.isActive ?? true
  });
  return NextResponse.json({ item }, { status: 201 });
}
