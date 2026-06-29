import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/db/mongoose';
import { Order, PaymentReceipt } from '@/models';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await connectToDatabase();
  const raw = await Order.findOne({ _id: id, user: user.userId })
    .populate('items.product', 'name slug images')
    .populate('shippingMethod', 'name')
    .lean();
  if (!raw) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const item = raw as Record<string, unknown>;
  const shippingMethod = item.shippingMethod as { name?: string } | string | null | undefined;
  const shippingMethodName =
    shippingMethod && typeof shippingMethod === 'object' ? shippingMethod.name : undefined;

  const receipts = (await PaymentReceipt.find({ order: id })
    .select('status reviewedAt')
    .lean()) as unknown as Array<{ status: string; reviewedAt?: Date }>;
  const activeReceipt = receipts.find((r) => r.status !== 'REJECTED') || receipts[receipts.length - 1];
  const rejectCount = receipts.filter((r) => r.status === 'REJECTED').length;

  return NextResponse.json({
    item: {
      ...item,
      shippingMethodName,
      receiptStatus: activeReceipt?.status || null,
      receiptReviewedAt: activeReceipt?.reviewedAt || null,
      receiptRejectCount: rejectCount
    }
  });
}
