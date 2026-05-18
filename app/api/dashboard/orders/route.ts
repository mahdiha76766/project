import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/db/mongoose';
import { Order } from '@/models';

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

  const items = await Order.find(filter).sort({ createdAt: -1 }).select('totalAmount orderStatus paymentStatus trackingCode createdAt').lean();
  return NextResponse.json({ items });
}
