import { NextResponse } from 'next/server';
import { Order } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
import { MANAGEABLE_ORDER_STATUSES, ORDER_STATUSES, PAYMENT_STATUSES } from '@/constants/order';
import { notifyOrderStatus } from '@/lib/finance/notification-service';
import { resolveUserId } from '@/lib/utils/resolve-user-id';

async function guard() {
  const user = await getSessionUser();
  return user && hasMinimumRole(user.role, 'ADMIN');
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  await connectToDatabase();
  const item = await Order.findById(id).populate('user', 'name mobile email').populate('items.product').lean();
  if (!item) return NextResponse.json({ error: 'سفارش یافت نشد.' }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { id } = await params;
    const body = await req.json();
    const patch: Record<string, string> = {};
    if (body.orderStatus !== undefined) {
      if (!MANAGEABLE_ORDER_STATUSES.includes(body.orderStatus) && !ORDER_STATUSES.includes(body.orderStatus)) {
        return NextResponse.json({ error: 'وضعیت سفارش نامعتبر است.' }, { status: 400 });
      }
      patch.orderStatus = body.orderStatus;
    }
    if (body.paymentStatus !== undefined) {
      if (!PAYMENT_STATUSES.includes(body.paymentStatus)) {
        return NextResponse.json({ error: 'وضعیت پرداخت نامعتبر است.' }, { status: 400 });
      }
      patch.paymentStatus = body.paymentStatus;
    }
    if (body.trackingCode !== undefined) patch.trackingCode = String(body.trackingCode).trim();
    if (body.trackingUrl !== undefined) patch.trackingUrl = String(body.trackingUrl).trim();
    if (!Object.keys(patch).length) {
      return NextResponse.json({ error: 'فیلدی برای به‌روزرسانی ارسال نشده است.' }, { status: 400 });
    }
    await connectToDatabase();
    const item = await Order.findByIdAndUpdate(id, patch, { new: true }).populate('user', 'name mobile');
    if (!item) return NextResponse.json({ error: 'سفارش یافت نشد.' }, { status: 404 });
    if (patch.orderStatus || patch.trackingCode) {
      const userDoc = item.user as { name?: string; mobile?: string } | null;
      await notifyOrderStatus(resolveUserId(item.user), String(item._id), patch.orderStatus || item.orderStatus, {
        tracking: patch.trackingCode || item.trackingCode,
        amount: item.totalAmount,
        mobile: userDoc?.mobile,
        name: userDoc?.name
      });
    }
    return NextResponse.json({ item });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'خطا در به‌روزرسانی سفارش';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  await connectToDatabase();
  await Order.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
