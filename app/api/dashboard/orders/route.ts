import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/db/mongoose';
import { Order, PaymentReceipt } from '@/models';

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectToDatabase();

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  const filter: Record<string, unknown> = { user: user.userId };
  if (status) filter.orderStatus = status;
  if (from || to) filter.createdAt = { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(to) } : {}) };

  const items = await Order.find(filter)
    .sort({ createdAt: -1 })
    .select('totalAmount orderStatus paymentStatus trackingCode createdAt invoiceNumber')
    .lean();

  const orderIds = items.map((o) => o._id);
  const receipts = (await PaymentReceipt.find({ order: { $in: orderIds } })
    .select('order status reviewedAt')
    .sort({ createdAt: 1 })
    .lean()) as unknown as Array<{ order: any; status: string; reviewedAt?: Date }>;

  // Group by order id
  const orderReceiptsMap = new Map<string, typeof receipts>();
  for (const r of receipts) {
    const oId = String(r.order);
    if (!orderReceiptsMap.has(oId)) {
      orderReceiptsMap.set(oId, []);
    }
    orderReceiptsMap.get(oId)!.push(r);
  }

  const mergedItems = items.map((o) => {
    const rList = orderReceiptsMap.get(String(o._id)) || [];
    const activeReceipt = rList.find((r) => r.status !== 'REJECTED') || rList[rList.length - 1];
    const rejectCount = rList.filter((r) => r.status === 'REJECTED').length;

    return {
      ...o,
      receiptStatus: activeReceipt?.status || null,
      receiptReviewedAt: activeReceipt?.reviewedAt || null,
      receiptRejectCount: rejectCount
    };
  });

  return NextResponse.json({ items: mergedItems });
}
