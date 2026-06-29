import { NextResponse } from 'next/server';
import { ShippingMethod } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
import { DEFAULT_SHIPPING_ON_DELIVERY, SHIPPING_METHOD_CODES } from '@/constants/shipping';

async function guard() {
  const u = await getSessionUser();
  return u && hasMinimumRole(u.role, 'ADMIN');
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { id } = await params;
    const b = await req.json();
    const code = b.code ? String(b.code).trim().toUpperCase() : undefined;
    if (code && !SHIPPING_METHOD_CODES.includes(code as any)) {
      return NextResponse.json({ error: 'کد روش ارسال معتبر نیست.' }, { status: 400 });
    }
    await connectToDatabase();
    const existing = await ShippingMethod.findById(id).lean() as { code?: string } | null;
    const resolvedCode = code || existing?.code;
    const item = await ShippingMethod.findByIdAndUpdate(
      id,
      {
        code,
        name: b.name?.trim(),
        baseCost: Number(b.baseCost || 0),
        costPerKg: Number(b.costPerKg || 0),
        estimatedDays: Number(b.estimatedDays || 1),
        cityOnly: Boolean(b.cityOnly),
        freeAboveAmount: b.freeAboveAmount ? Number(b.freeAboveAmount) : 0,
        allowShippingOnDelivery:
          b.allowShippingOnDelivery ??
          (resolvedCode
            ? DEFAULT_SHIPPING_ON_DELIVERY[resolvedCode as keyof typeof DEFAULT_SHIPPING_ON_DELIVERY]
            : true),
        isActive: b.isActive ?? true
      },
      { new: true, runValidators: true }
    );
    if (!item) return NextResponse.json({ error: 'روش ارسال یافت نشد.' }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'خطا در ویرایش روش ارسال' }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  await connectToDatabase();
  await ShippingMethod.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
