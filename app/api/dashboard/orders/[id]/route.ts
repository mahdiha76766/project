import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/db/mongoose';
import { Order } from '@/models';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await connectToDatabase();
  const item = await Order.findOne({ _id: id, user: user.userId }).populate('items.product', 'name slug images').populate('shippingMethod', 'name').lean();
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ item });
}
